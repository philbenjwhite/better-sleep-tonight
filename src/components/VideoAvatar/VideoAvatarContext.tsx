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
  'avatar-intro': '/videos/ashley_with_voice_we_control.mp4',
  // Add more videos as they're created:
  // 'summary-back-pain': '/videos/avatar/summary-back-pain.mp4',
  // 'empathy-general': '/videos/avatar/empathy-general.mp4',
  // 'email-cta': '/videos/avatar/email-cta.mp4',
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
  currentVideoId: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  play: (videoId: string) => Promise<void>;
  stop: () => void;
  setVideoRef: (ref: HTMLVideoElement | null) => void;
  onVideoEnded: () => void;
  onVideoLoaded: () => void;
  onVideoPlay: () => void;
  onVideoError: () => void;
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playPromiseRef = useRef<{
    resolve: () => void;
    reject: (error: Error) => void;
  } | null>(null);

  const setVideoRef = useCallback((ref: HTMLVideoElement | null) => {
    videoRef.current = ref;
  }, []);

  const play = useCallback(async (videoId: string): Promise<void> => {
    const videoSrc = VIDEO_REGISTRY[videoId];
    if (!videoSrc) {
      console.error(`[VideoAvatar] Unknown video ID: ${videoId}`);
      return;
    }

    if (!videoRef.current) {
      console.error('[VideoAvatar] Video element not mounted');
      return;
    }

    return new Promise((resolve, reject) => {
      playPromiseRef.current = { resolve, reject };

      setVideoState(VideoState.LOADING);
      setCurrentVideoId(videoId);

      // Update video source and load
      videoRef.current!.src = videoSrc;
      videoRef.current!.load();
    });
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

  const isPlaying = videoState === VideoState.PLAYING;

  return (
    <VideoAvatarContext.Provider
      value={{
        videoState,
        isPlaying,
        currentVideoId,
        videoRef,
        play,
        stop,
        setVideoRef,
        onVideoEnded,
        onVideoLoaded,
        onVideoPlay,
        onVideoError,
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
