'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useVideoAvatar, VideoState } from './VideoAvatarContext';
import styles from './VideoAvatar.module.css';

export interface VideoAvatarProps {
  className?: string;
  fallbackImage?: string;
  alt?: string;
  isMuted?: boolean;
}

export const VideoAvatar: React.FC<VideoAvatarProps> = ({
  className,
  fallbackImage = '/images/ashley-video-frame.png',
  alt = 'Ashley, your virtual sleep guide',
  isMuted = false,
}) => {
  const {
    videoState,
    setVideoRef,
    onVideoEnded,
    onVideoLoaded,
    onVideoPlay,
    onVideoError,
    onVideoTimeUpdate,
  } = useVideoAvatar();

  const videoElementRef = useRef<HTMLVideoElement>(null);
  // Track if a video has ever been loaded (to know when to show fallback vs last frame)
  const [hasPlayedVideo, setHasPlayedVideo] = useState(false);

  // Register video element with context
  useEffect(() => {
    setVideoRef(videoElementRef.current);
    return () => setVideoRef(null);
  }, [setVideoRef]);

  // Track when video has played at least once
  useEffect(() => {
    if (videoState === VideoState.PLAYING) {
      setHasPlayedVideo(true);
    }
  }, [videoState]);

  const isLoading = videoState === VideoState.LOADING;
  const hasError = videoState === VideoState.ERROR;
  const isIdle = videoState === VideoState.IDLE;
  const isEnded = videoState === VideoState.ENDED;
  const isPlaying = videoState === VideoState.PLAYING;
  const isReady = videoState === VideoState.READY;

  // Show fallback image only when:
  // 1. Before first video plays (idle and never played)
  // 2. On error
  // Don't show fallback when ended - keep showing the video's last frame
  const showFallbackImage = (isIdle && !hasPlayedVideo) || hasError;

  // Video is visible when playing, ready, loading, OR ended (to show last frame)
  const showVideo = isPlaying || isReady || isLoading || isEnded;

  return (
    <div className={`${styles.avatarContainer} ${className || ''}`}>
      {/* Fallback image - shown as background when video ends to prevent black frame */}
      {showFallbackImage && (
        <Image
          src={fallbackImage}
          alt={alt}
          fill
          className={styles.avatarImage}
          priority
        />
      )}

      {/* Video element - overlays fallback image when playing */}
      <video
        ref={videoElementRef}
        className={styles.avatarVideo}
        playsInline
        muted={isMuted}
        onLoadedData={onVideoLoaded}
        onPlay={onVideoPlay}
        onEnded={onVideoEnded}
        onError={onVideoError}
        onTimeUpdate={onVideoTimeUpdate}
        style={{
          display: showVideo ? 'block' : 'none',
          opacity: hasError ? 0 : 1,
        }}
      />

      {/* Loading spinner */}
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner} />
        </div>
      )}

      {/* Error message */}
      {hasError && (
        <div className={styles.errorMessage}>
          Video failed to load
        </div>
      )}
    </div>
  );
};

export default VideoAvatar;
