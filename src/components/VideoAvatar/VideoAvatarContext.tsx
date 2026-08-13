'use client';

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  ReactNode,
  useEffect,
} from 'react';
import { ConnectionQuality } from '@/hooks/useNetworkStatus';
import { getPreloadStrategy } from '@/hooks/useAdaptiveVideo';

// Video registry - maps video IDs to file paths
export const VIDEO_REGISTRY: Record<string, string> = {
  'avatar-intro': '/videos/ashley/ashley-1.mp4',
};

export type VideoId = keyof typeof VIDEO_REGISTRY;

export enum VideoState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  READY = 'READY',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  ENDED = 'ENDED',
  /**
   * Playback was refused by the browser's autoplay policy. The media itself is
   * fine — it just needs a user gesture. Kept distinct from ERROR because iOS
   * Safari refuses every unmuted off-gesture play(), and conflating the two
   * made a routine policy decision look like a corrupt video.
   */
  BLOCKED = 'BLOCKED',
  /** The media genuinely failed to load or decode. */
  ERROR = 'ERROR',
}

/**
 * How far from the end a segment is stopped, and how far from the end the still
 * that replaces it is taken.
 *
 * Both are set by what timeupdate can promise. It fires roughly four times a
 * second, so the first tick at or past a threshold can be a further ~0.25s
 * along — the stop therefore lands somewhere in [dur - 0.4, dur - 0.15], and
 * the capture in [dur - 1, dur - 0.5].
 *
 * The window matters because every avatar recording delivered so far ends on
 * three black frames, 0.1s of them, baked into the file. Stopping inside that
 * tail puts the black on screen, which is what the funnel used to do. Both
 * margins clear it with room to spare, and the tail of a talking head that is
 * already settling is not worth the risk of cutting it finer.
 */
const STOP_BEFORE_END_SECONDS = 0.4;
const CAPTURE_BEFORE_END_SECONDS = 0.5;

/** True for the autoplay-policy refusal browsers raise from play(). */
function isAutoplayRefusal(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'NotAllowedError';
}

interface VideoAvatarContextType {
  videoState: VideoState;
  isPlaying: boolean;
  isNearingEnd: boolean;
  isBuffering: boolean;
  /** True while the current video is set to loop (e.g. the closing idle loop) */
  isLooping: boolean;
  /**
   * True when the segment is playing only because we had to force-mute it to
   * satisfy an autoplay policy. The user has not asked for silence, so the UI
   * should offer a way to turn sound back on.
   */
  isAudioBlocked: boolean;
  /** Start playback from inside a user gesture, after a BLOCKED refusal. */
  resume: () => void;
  /** Turn sound on from inside a user gesture, after a forced mute. */
  enableAudio: () => void;
  currentVideoId: string | null;
  currentTime: number;
  duration: number;
  connectionQuality: ConnectionQuality;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /**
   * True while the still of the outgoing segment's last frame should cover the
   * player. Set when a new source is about to replace one that is on screen,
   * cleared once the new source has painted a frame of its own.
   */
  showHeldFrame: boolean;
  /** Registers the canvas the held frame is drawn into. */
  setHeldFrameRef: (ref: HTMLCanvasElement | null) => void;
  play: (videoId: string, options?: { loop?: boolean }) => Promise<void>;
  pause: () => void;
  skip: () => void;
  preload: (videoIdOrPath: string) => void;
  preloadMultiple: (videoIds: string[]) => void;
  stop: () => void;
  setVideoRef: (ref: HTMLVideoElement | null) => void;
  setConnectionQuality: (quality: ConnectionQuality) => void;
  onVideoEnded: () => void;
  onVideoLoaded: () => void;
  onVideoPlay: () => void;
  onVideoError: () => void;
  onVideoTimeUpdate: () => void;
  onVideoWaiting: () => void;
  onVideoCanPlay: () => void;
}

const VideoAvatarContext = createContext<VideoAvatarContextType | null>(null);

interface VideoAvatarProviderProps {
  children: ReactNode;
  onVideoEnd?: () => void;
}

export const VideoAvatarProvider: React.FC<VideoAvatarProviderProps> = ({
  children,
  onVideoEnd,
}) => {
  const [videoState, setVideoState] = useState<VideoState>(VideoState.IDLE);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [isNearingEnd, setIsNearingEnd] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>(
    ConnectionQuality.FAST
  );
  const [isAudioBlocked, setIsAudioBlocked] = useState(false);
  const [showHeldFrame, setShowHeldFrame] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const heldFrameCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const heldFrameTimeoutRef = useRef<number | undefined>(undefined);
  const hasCapturedFrameRef = useRef(false);
  const playPromiseRef = useRef<{
    resolve: () => void;
    reject: (error: Error) => void;
  } | null>(null);
  const preloadedUrls = useRef<Set<string>>(new Set());

  /**
   * Start playback, degrading rather than failing.
   *
   * iOS Safari refuses play() on an unmuted element outside a user gesture, and
   * this funnel starts every segment from an effect, so the refusal is the
   * common path rather than the exception. A refusal on an unmuted element is
   * retried muted, which iOS always permits inline: the segment still plays and
   * the caller can offer to turn sound back on. Only when muted playback is
   * refused too do we report BLOCKED, and a genuine load/decode failure is left
   * to the element's own error event.
   */
  const attemptPlay = useCallback(
    async (element: HTMLVideoElement): Promise<boolean> => {
      try {
        await element.play();
        return true;
      } catch (error) {
        if (!isAutoplayRefusal(error) || element.muted) {
          return false;
        }
        element.muted = true;
        setIsAudioBlocked(true);
        try {
          await element.play();
          return true;
        } catch {
          return false;
        }
      }
    },
    []
  );

  const setVideoRef = useCallback((ref: HTMLVideoElement | null) => {
    videoRef.current = ref;
  }, []);

  const setHeldFrameRef = useCallback((ref: HTMLCanvasElement | null) => {
    heldFrameCanvasRef.current = ref;
  }, []);

  /**
   * Copy the frame currently on screen into the held-frame canvas, without
   * putting it up.
   *
   * Two separate things blank the player, and one still covers both. Assigning
   * a new src empties the element, and the browser paints that gap black —
   * milliseconds on a warm cache, a lot longer on a cold one. And every avatar
   * segment so far ends on three black frames, baked into the recording, which
   * the near-end pause in onVideoTimeUpdate is meant to stop short of but
   * cannot reliably: timeupdate fires about four times a second, so where the
   * pause actually lands is a coin toss over a window wider than the black tail
   * itself.
   *
   * So the capture is deliberately taken early, while the segment is still
   * playing a frame worth keeping, and held from the pause through the swap.
   */
  const captureFrame = useCallback((): boolean => {
    const video = videoRef.current;
    const canvas = heldFrameCanvasRef.current;
    if (!video || !canvas) return false;
    // HAVE_CURRENT_DATA or better, or there is nothing decoded to copy — which
    // is the normal case for the first segment of the funnel.
    if (video.readyState < 2 || !video.videoWidth) return false;

    // Half the source's width is more than enough for a still that stands in
    // for the player briefly, and keeps the backing store off a phone's budget.
    const width = Math.min(video.videoWidth, 720);
    const height = Math.round((width / video.videoWidth) * video.videoHeight);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const context = canvas.getContext('2d');
    if (!context) return false;
    context.drawImage(video, 0, 0, width, height);
    hasCapturedFrameRef.current = true;
    return true;
  }, []);

  /** Put the captured still up over the player. */
  const holdCapturedFrame = useCallback(() => {
    if (hasCapturedFrameRef.current) setShowHeldFrame(true);
  }, []);

  /**
   * Uncover the player, once the new segment has a frame of its own.
   *
   * The play event fires before that frame is composited, so where the browser
   * can tell us about frames directly, wait to be told. The timeout is the
   * backstop for the browsers that cannot, and for a segment that plays without
   * ever presenting a frame: a stale still left up forever is worse than the
   * flash this avoids.
   */
  const releaseHeldFrame = useCallback(() => {
    const video = videoRef.current;
    window.clearTimeout(heldFrameTimeoutRef.current);
    heldFrameTimeoutRef.current = window.setTimeout(
      () => setShowHeldFrame(false),
      1000,
    );
    if (video && 'requestVideoFrameCallback' in video) {
      video.requestVideoFrameCallback(() => {
        window.clearTimeout(heldFrameTimeoutRef.current);
        setShowHeldFrame(false);
      });
      return;
    }
    setShowHeldFrame(false);
  }, []);

  const play = useCallback(async (videoIdOrPath: string, options?: { loop?: boolean }): Promise<void> => {
    // Accept either a registry ID or a direct path (starting with /)
    const videoSrc = videoIdOrPath.startsWith('/')
      ? videoIdOrPath
      : VIDEO_REGISTRY[videoIdOrPath];

    if (!videoSrc) {
      console.error(`[VideoAvatar] Unknown video ID: ${videoIdOrPath}`);
      return;
    }

    // CRITICAL FOR MOBILE: If video element exists, start playback synchronously
    // within the user gesture context. Mobile browsers require play() to be called
    // synchronously within a user-initiated event (click/tap handler).
    if (videoRef.current) {
      const videoElement = videoRef.current;

      // Cover the swap. A segment that is still playing gives a fresh frame;
      // one that has already been stopped (the near-end pause, or a skip) has
      // left one behind for exactly this.
      if (!videoElement.paused) captureFrame();
      holdCapturedFrame();

      const segment = new Promise<void>((resolve, reject) => {
        playPromiseRef.current = { resolve, reject };

        setVideoState(VideoState.LOADING);
        setCurrentVideoId(videoIdOrPath);
        setIsNearingEnd(false);
        // Give each segment a fresh chance at sound: if the policy refuses
        // again, attemptPlay re-mutes it.
        setIsAudioBlocked(false);

        // Set loop attribute based on options
        videoElement.loop = options?.loop ?? false;
        setIsLooping(videoElement.loop);

        // Set source and start playback synchronously within user gesture
        videoElement.src = videoSrc;

        // Call play() immediately - don't wait for loadeddata event
        // This is essential for mobile autoplay policy compliance
        void attemptPlay(videoElement).then((started) => {
          // A refusal here is not fatal: onVideoLoaded retries once the media
          // is ready, which is the path that succeeds when the element was
          // still loading. Only that retry decides BLOCKED.
          if (!started && videoElement.readyState >= 2) {
            setVideoState(VideoState.BLOCKED);
          }
        });
      });

      // Callers treat this as "the segment finished" and never attach a
      // rejection handler, so hand back a promise that cannot reject. Without
      // this, every refusal surfaced as an unhandled rejection.
      return segment.catch(() => {});
    }

    // Fallback: Wait for video element to be mounted (with timeout)
    // This path is used when video element isn't mounted yet
    const waitForVideoElement = async (): Promise<HTMLVideoElement> => {
      return new Promise((resolve, reject) => {
        if (videoRef.current) {
          resolve(videoRef.current);
          return;
        }

        // Poll for video element (component may not be mounted yet)
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait
        const interval = setInterval(() => {
          attempts++;
          if (videoRef.current) {
            clearInterval(interval);
            resolve(videoRef.current);
          } else if (attempts >= maxAttempts) {
            clearInterval(interval);
            reject(new Error('Video element not mounted after timeout'));
          }
        }, 100);
      });
    };

    try {
      const videoElement = await waitForVideoElement().catch(() => {
        // Video element was unmounted (e.g., navigated away from video step)
        return null;
      });
      if (!videoElement) return;

      const segment = new Promise<void>((resolve, reject) => {
        playPromiseRef.current = { resolve, reject };

        setVideoState(VideoState.LOADING);
        setCurrentVideoId(videoIdOrPath);
        setIsNearingEnd(false); // Reset for new video
        setIsAudioBlocked(false);

        // Set loop attribute based on options
        videoElement.loop = options?.loop ?? false;
        setIsLooping(videoElement.loop);

        if (!videoElement.paused) captureFrame();
        holdCapturedFrame();

        // Update video source and load
        videoElement.src = videoSrc;
        videoElement.load();
      });

      return segment.catch(() => {});
    } catch (error) {
      console.error('[VideoAvatar] Failed to get video element:', error);
    }
  }, [attemptPlay, captureFrame, holdCapturedFrame]);

  const pause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      setVideoState(VideoState.PAUSED);
    }
  }, []);

  // Skip the rest of the current video. Produces exactly the same ENDED
  // transition a video reaching its natural end produces (see the tail of
  // onVideoTimeUpdate), so every downstream advance handler works unchanged.
  /**
   * Start playback from inside a user gesture. Called by the tap-to-play
   * control shown on a BLOCKED segment, which is the one context in which the
   * policy is guaranteed to allow sound.
   */
  const resume = useCallback(() => {
    const element = videoRef.current;
    if (!element) return;
    element.muted = false;
    setIsAudioBlocked(false);
    void attemptPlay(element).then((started) => {
      if (!started) setVideoState(VideoState.BLOCKED);
    });
  }, [attemptPlay]);

  /** Turn sound on after a forced mute. Must be called from a user gesture. */
  const enableAudio = useCallback(() => {
    const element = videoRef.current;
    if (!element) return;
    element.muted = false;
    setIsAudioBlocked(false);
    if (element.paused) void attemptPlay(element);
  }, [attemptPlay]);

  const skip = useCallback(() => {
    const isSkippable =
      videoState === VideoState.LOADING ||
      videoState === VideoState.READY ||
      videoState === VideoState.PLAYING ||
      videoState === VideoState.PAUSED ||
      // A refused segment must stay escapable, otherwise a user whose device
      // blocks autoplay outright has no way off the step.
      videoState === VideoState.BLOCKED;

    // Looping videos (e.g. the idle loop on the final step) have nothing to
    // advance to — skipping them would strand the user.
    if (!isSkippable || isLooping || videoRef.current?.loop) return;

    // Capture before pausing, while there is still a frame to take, so the skip
    // hands over on a held still rather than on whatever the element shows once
    // it is emptied.
    captureFrame();
    videoRef.current?.pause();
    setVideoState(VideoState.ENDED);
    playPromiseRef.current?.resolve();
    playPromiseRef.current = null;
    onVideoEnd?.();
  }, [videoState, isLooping, onVideoEnd, captureFrame]);

  const preload = useCallback((videoIdOrPath: string) => {
    const { preloadAttribute } = getPreloadStrategy(connectionQuality);

    // Skip preloading on slow connections
    if (preloadAttribute === 'none') {
      return;
    }

    const videoSrc = videoIdOrPath.startsWith('/')
      ? videoIdOrPath
      : VIDEO_REGISTRY[videoIdOrPath];

    if (!videoSrc || preloadedUrls.current.has(videoSrc)) {
      return;
    }

    preloadedUrls.current.add(videoSrc);

    // Use <link rel="preload"> so the browser caches the fetch and reuses it
    // when the actual <video> element sets its src — avoids double-downloading
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'fetch';
    link.href = videoSrc;
    document.head.appendChild(link);
  }, [connectionQuality]);

  // Preload multiple videos based on connection quality
  const preloadMultiple = useCallback(
    (videoIds: string[]) => {
      const { preloadCount } = getPreloadStrategy(connectionQuality);

      if (preloadCount === 0) {
        return;
      }

      // Only preload up to preloadCount videos
      const videosToPreload = videoIds.slice(0, preloadCount);
      videosToPreload.forEach((videoId) => preload(videoId));
    },
    [connectionQuality, preload]
  );

  const stop = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setVideoState(VideoState.IDLE);
    setCurrentVideoId(null);
    window.clearTimeout(heldFrameTimeoutRef.current);
    setShowHeldFrame(false);
  }, []);

  const onVideoLoaded = useCallback(() => {
    // Check if video is already playing (started synchronously in play())
    // If so, don't change state - keep it as PLAYING
    if (videoRef.current && !videoRef.current.paused) {
      return;
    }

    setVideoState(VideoState.READY);
    // Auto-play when loaded (fallback for when immediate play didn't work)
    const element = videoRef.current;
    if (element) {
      void attemptPlay(element).then((started) => {
        if (started) return;
        // Refused even muted (iOS Low Power Mode, or Auto-Play set to Never).
        // The media is loaded and fine, so surface a tap-to-play control rather
        // than reporting a failure and hiding the step.
        console.warn('[VideoAvatar] Playback refused by autoplay policy');
        setVideoState(VideoState.BLOCKED);
      });
    }
  }, [attemptPlay]);

  const onVideoPlay = useCallback(() => {
    setVideoState(VideoState.PLAYING);
    releaseHeldFrame();
  }, [releaseHeldFrame]);

  const onVideoEnded = useCallback(() => {
    setVideoState(VideoState.ENDED);
    playPromiseRef.current?.resolve();
    playPromiseRef.current = null;
    onVideoEnd?.();
  }, [onVideoEnd]);

  const onVideoError = useCallback(() => {
    console.error('[VideoAvatar] Video error');
    setVideoState(VideoState.ERROR);
    // Nothing is coming to replace the held frame, and the steps that survive a
    // failed segment do it by showing their own content, not the player.
    window.clearTimeout(heldFrameTimeoutRef.current);
    setShowHeldFrame(false);
    playPromiseRef.current?.reject(new Error('Video playback error'));
    playPromiseRef.current = null;
  }, []);

  const onVideoTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const { currentTime: time, duration: dur } = videoRef.current;
      setCurrentTime(time);
      setDuration(dur || 0);
      // Trigger "nearing end" when ~1 second from end
      if (dur && time >= dur - 1 && !isNearingEnd) {
        setIsNearingEnd(true);
      }
      // Keep a still of the run-out, taken while the segment is safely clear of
      // its own end. See CAPTURE_BEFORE_END_SECONDS.
      if (
        dur &&
        time >= dur - 1 &&
        time < dur - CAPTURE_BEFORE_END_SECONDS &&
        !videoRef.current.loop
      ) {
        captureFrame();
      }
      // Stop before the end and hold that still, so the segment rests on a
      // frame of Ashley rather than on the recording's black tail or on an
      // empty element. Skip for looping videos. Manually fire ended state so
      // app logic continues.
      if (
        dur &&
        time >= dur - STOP_BEFORE_END_SECONDS &&
        !videoRef.current.paused &&
        !videoRef.current.loop
      ) {
        videoRef.current.pause();
        holdCapturedFrame();
        setVideoState(VideoState.ENDED);
        playPromiseRef.current?.resolve();
        playPromiseRef.current = null;
        onVideoEnd?.();
      }
    }
  }, [isNearingEnd, onVideoEnd, captureFrame, holdCapturedFrame]);

  // Buffering detection - called when video is waiting for data
  const onVideoWaiting = useCallback(() => {
    setIsBuffering(true);
  }, []);

  // Called when video can resume playing after buffering
  const onVideoCanPlay = useCallback(() => {
    if (isBuffering) {
      setIsBuffering(false);
    }
  }, [isBuffering]);

  // Reset buffering state when video ends or is stopped
  useEffect(() => {
    if (videoState === VideoState.ENDED || videoState === VideoState.IDLE) {
      setIsBuffering(false);
    }
  }, [videoState]);

  const isPlaying = videoState === VideoState.PLAYING;

  return (
    <VideoAvatarContext.Provider
      value={{
        videoState,
        isPlaying,
        isNearingEnd,
        isBuffering,
        isLooping,
        isAudioBlocked,
        resume,
        enableAudio,
        currentVideoId,
        currentTime,
        duration,
        connectionQuality,
        videoRef,
        showHeldFrame,
        setHeldFrameRef,
        play,
        pause,
        skip,
        preload,
        preloadMultiple,
        stop,
        setVideoRef,
        setConnectionQuality,
        onVideoEnded,
        onVideoLoaded,
        onVideoPlay,
        onVideoError,
        onVideoTimeUpdate,
        onVideoWaiting,
        onVideoCanPlay,
      }}
    >
      {children}
    </VideoAvatarContext.Provider>
  );
};

export const useVideoAvatar = (): VideoAvatarContextType => {
  const context = useContext(VideoAvatarContext);
  if (!context) {
    throw new Error('useVideoAvatar must be used within a VideoAvatarProvider');
  }
  return context;
};
