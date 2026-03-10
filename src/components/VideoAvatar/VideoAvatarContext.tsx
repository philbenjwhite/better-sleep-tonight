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
  ERROR = 'ERROR',
}

interface VideoAvatarContextType {
  videoState: VideoState;
  isPlaying: boolean;
  isNearingEnd: boolean;
  isBuffering: boolean;
  currentVideoId: string | null;
  currentTime: number;
  duration: number;
  connectionQuality: ConnectionQuality;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  play: (videoId: string, options?: { loop?: boolean }) => Promise<void>;
  pause: () => void;
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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>(
    ConnectionQuality.FAST
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playPromiseRef = useRef<{
    resolve: () => void;
    reject: (error: Error) => void;
  } | null>(null);
  const preloadedUrls = useRef<Set<string>>(new Set());

  const setVideoRef = useCallback((ref: HTMLVideoElement | null) => {
    videoRef.current = ref;
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

      return new Promise((resolve, reject) => {
        playPromiseRef.current = { resolve, reject };

        setVideoState(VideoState.LOADING);
        setCurrentVideoId(videoIdOrPath);
        setIsNearingEnd(false);

        // Set loop attribute based on options
        videoElement.loop = options?.loop ?? false;

        // Set source and start playback synchronously within user gesture
        videoElement.src = videoSrc;

        // Call play() immediately - don't wait for loadeddata event
        // This is essential for mobile autoplay policy compliance
        const playPromise = videoElement.play();

        if (playPromise !== undefined) {
          playPromise
            .catch(() => {
              // If autoplay fails, we'll fall back to onVideoLoaded handler
            });
        }
      });
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

      return new Promise((resolve, reject) => {
        playPromiseRef.current = { resolve, reject };

        setVideoState(VideoState.LOADING);
        setCurrentVideoId(videoIdOrPath);
        setIsNearingEnd(false); // Reset for new video

        // Set loop attribute based on options
        videoElement.loop = options?.loop ?? false;

        // Update video source and load
        videoElement.src = videoSrc;
        videoElement.load();
      });
    } catch (error) {
      console.error('[VideoAvatar] Failed to get video element:', error);
    }
  }, []);

  const pause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      setVideoState(VideoState.PAUSED);
    }
  }, []);

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
    link.as = 'video';
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
  }, []);

  const onVideoLoaded = useCallback(() => {
    // Check if video is already playing (started synchronously in play())
    // If so, don't change state - keep it as PLAYING
    if (videoRef.current && !videoRef.current.paused) {
      return;
    }

    setVideoState(VideoState.READY);
    // Auto-play when loaded (fallback for when immediate play didn't work)
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.error('[VideoAvatar] Autoplay failed:', error);
        setVideoState(VideoState.ERROR);
        playPromiseRef.current?.reject(error);
      });
    }
  }, []);

  const onVideoPlay = useCallback(() => {
    setVideoState(VideoState.PLAYING);
  }, []);

  const onVideoEnded = useCallback(() => {
    setVideoState(VideoState.ENDED);
    playPromiseRef.current?.resolve();
    playPromiseRef.current = null;
    onVideoEnd?.();
  }, [onVideoEnd]);

  const onVideoError = useCallback(() => {
    console.error('[VideoAvatar] Video error');
    setVideoState(VideoState.ERROR);
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
    }
  }, [isNearingEnd]);

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
        currentVideoId,
        currentTime,
        duration,
        connectionQuality,
        videoRef,
        play,
        pause,
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
