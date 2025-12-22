'use client';

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  ReactNode,
} from 'react';

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
  ENDED = 'ENDED',
  ERROR = 'ERROR',
}

interface VideoAvatarContextType {
  videoState: VideoState;
  isPlaying: boolean;
  isNearingEnd: boolean;
  currentVideoId: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  play: (videoId: string) => Promise<void>;
  stop: () => void;
  setVideoRef: (ref: HTMLVideoElement | null) => void;
  onVideoEnded: () => void;
  onVideoLoaded: () => void;
  onVideoPlay: () => void;
  onVideoError: () => void;
  onVideoTimeUpdate: () => void;
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playPromiseRef = useRef<{
    resolve: () => void;
    reject: (error: Error) => void;
  } | null>(null);

  const setVideoRef = useCallback((ref: HTMLVideoElement | null) => {
    videoRef.current = ref;
  }, []);

  const play = useCallback(async (videoIdOrPath: string): Promise<void> => {
    // Accept either a registry ID or a direct path (starting with /)
    const videoSrc = videoIdOrPath.startsWith('/')
      ? videoIdOrPath
      : VIDEO_REGISTRY[videoIdOrPath];

    if (!videoSrc) {
      console.error(`[VideoAvatar] Unknown video ID: ${videoIdOrPath}`);
      return;
    }

    // Wait for video element to be mounted (with timeout)
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
      const videoElement = await waitForVideoElement();

      return new Promise((resolve, reject) => {
        playPromiseRef.current = { resolve, reject };

        setVideoState(VideoState.LOADING);
        setCurrentVideoId(videoIdOrPath);
        setIsNearingEnd(false); // Reset for new video

        // Update video source and load
        videoElement.src = videoSrc;
        videoElement.load();
      });
    } catch (error) {
      console.error('[VideoAvatar] Failed to get video element:', error);
    }
  }, []);

  const stop = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setVideoState(VideoState.IDLE);
    setCurrentVideoId(null);
  }, []);

  const onVideoLoaded = useCallback(() => {
    setVideoState(VideoState.READY);
    // Auto-play when loaded
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
      const { currentTime, duration } = videoRef.current;
      // Trigger "nearing end" when ~1 second from end
      if (duration && currentTime >= duration - 1 && !isNearingEnd) {
        setIsNearingEnd(true);
      }
    }
  }, [isNearingEnd]);

  const isPlaying = videoState === VideoState.PLAYING;

  return (
    <VideoAvatarContext.Provider
      value={{
        videoState,
        isPlaying,
        isNearingEnd,
        currentVideoId,
        videoRef,
        play,
        stop,
        setVideoRef,
        onVideoEnded,
        onVideoLoaded,
        onVideoPlay,
        onVideoError,
        onVideoTimeUpdate,
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
