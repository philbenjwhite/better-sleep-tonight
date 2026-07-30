'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useVideoAvatar, VideoState } from './VideoAvatarContext';
import { SkipButton } from './SkipButton';
import styles from './VideoAvatar.module.css';

export interface VideoAvatarProps {
  className?: string;
  fallbackImage?: string;
  alt?: string;
  isMuted?: boolean;
  /**
   * Called when the user skips the current video. When provided, a skip control
   * is shown over the avatar while a video is playing or paused. The handler is
   * responsible for advancing the funnel — see `handleSkipVideo` in
   * src/app/page.tsx.
   */
  onSkip?: () => void;
}

export const VideoAvatar: React.FC<VideoAvatarProps> = ({
  className,
  fallbackImage = '/images/ashley-video-frame.png',
  alt = 'Ashley, your virtual sleep guide',
  isMuted = false,
  onSkip,
}) => {
  const {
    videoState,
    currentTime,
    duration,
    isBuffering,
    isLooping,
    isAudioBlocked,
    resume,
    enableAudio,
    setVideoRef,
    onVideoEnded,
    onVideoLoaded,
    onVideoPlay,
    onVideoError,
    onVideoTimeUpdate,
    onVideoWaiting,
    onVideoCanPlay,
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
  const isBlocked = videoState === VideoState.BLOCKED;
  const isIdle = videoState === VideoState.IDLE;
  const isEnded = videoState === VideoState.ENDED;
  const isPlaying = videoState === VideoState.PLAYING;
  const isReady = videoState === VideoState.READY;

  // Only show fallback before first video plays — video freezes on last frame after that
  const showFallbackImage = !hasPlayedVideo;

  // Video is visible when ready, playing, paused, or ended
  // Include READY state to handle cases where onPlay event doesn't fire
  const isPaused = videoState === VideoState.PAUSED;
  // BLOCKED means the media loaded but the policy refused to start it, so the
  // first frame is available and worth showing behind the tap-to-play control.
  const showVideo = isReady || isPlaying || isPaused || isEnded || isBlocked;

  // Video is paused on last frame when ended, so keep it visible
  const videoOpacity = hasError ? 0 : 1;

  // Skip is offered while a non-looping video still has content left to play.
  // The closing idle loop has nothing to advance to, so it gets no control.
  const canSkip =
    !!onSkip &&
    !isLooping &&
    (isLoading || isReady || isPlaying || isPaused || isBlocked);

  return (
    <div
      className={`${styles.avatarContainer} ${className || ''}`}
      // Surfaced for end-to-end tests: the playback state machine drives what
      // this step shows, and the blank-page regression it once caused is only
      // observable by asserting on the state itself.
      data-video-state={videoState}
    >
      {/* Media frame - clips the video and fallback to the 9:16 box */}
      <div className={styles.videoFrame}>
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
          // A forced mute is the fallback that kept the segment playing at all;
          // it has to win over the user's preference until they turn sound back
          // on, otherwise React would unmute and the policy would stall it.
          muted={isMuted || isAudioBlocked}
          onLoadedData={onVideoLoaded}
          onPlay={onVideoPlay}
          onEnded={onVideoEnded}
          onError={onVideoError}
          onTimeUpdate={onVideoTimeUpdate}
          onWaiting={onVideoWaiting}
          onCanPlay={onVideoCanPlay}
          style={{
            display: showVideo ? 'block' : 'none',
            opacity: videoOpacity,
            transition: 'opacity 0.1s ease-out',
          }}
        />
      </div>

      {/* Loading spinner */}
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner} />
        </div>
      )}

      {/* Buffering indicator - shown during video playback when waiting for data */}
      {isBuffering && isPlaying && (
        <div className={styles.bufferingOverlay}>
          <div className={styles.bufferingSpinner} />
        </div>
      )}

      {/* Tap to play - the device refused to start playback on its own */}
      {isBlocked && (
        <button
          type="button"
          className={styles.tapToPlay}
          onClick={(event) => {
            event.stopPropagation();
            resume();
          }}
          aria-label="Play video"
        >
          <span className={styles.tapToPlayIcon} aria-hidden="true" />
          <span className={styles.tapToPlayLabel}>Tap to play</span>
        </button>
      )}

      {/* Playing, but the policy forced it silent - offer sound back */}
      {isAudioBlocked && isPlaying && (
        <button
          type="button"
          className={styles.tapForSound}
          onClick={(event) => {
            event.stopPropagation();
            enableAudio();
          }}
          aria-label="Turn on sound"
        >
          Tap for sound
        </button>
      )}

      {/* Error message */}
      {hasError && (
        <div className={styles.errorMessage}>
          Video failed to load
        </div>
      )}

      {/* Skip control - lets the user move past any avatar video */}
      {canSkip && <SkipButton onSkip={onSkip} />}
    </div>
  );
};

export default VideoAvatar;
