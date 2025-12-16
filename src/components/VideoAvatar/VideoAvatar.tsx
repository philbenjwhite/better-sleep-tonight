'use client';

import React, { useEffect, useRef } from 'react';
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
  fallbackImage = '/images/avatar-2x.png',
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
  } = useVideoAvatar();

  const videoElementRef = useRef<HTMLVideoElement>(null);

  // Register video element with context
  useEffect(() => {
    setVideoRef(videoElementRef.current);
    return () => setVideoRef(null);
  }, [setVideoRef]);

  const isLoading = videoState === VideoState.LOADING;
  const hasError = videoState === VideoState.ERROR;
  const isIdle = videoState === VideoState.IDLE;
  const showVideo = !isIdle && !hasError;

  return (
    <div className={`${styles.avatarContainer} ${className || ''}`}>
      {/* Video element - hidden when idle, shown when playing */}
      <video
        ref={videoElementRef}
        className={styles.avatarVideo}
        playsInline
        muted={isMuted}
        onLoadedData={onVideoLoaded}
        onPlay={onVideoPlay}
        onEnded={onVideoEnded}
        onError={onVideoError}
        style={{ display: showVideo ? 'block' : 'none' }}
      />

      {/* Fallback image - shown when idle or on error */}
      {(isIdle || hasError) && (
        <Image
          src={fallbackImage}
          alt={alt}
          fill
          className={styles.avatarImage}
          priority
        />
      )}

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
