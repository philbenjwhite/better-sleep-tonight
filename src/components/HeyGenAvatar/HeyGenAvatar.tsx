"use client";

import React, { useEffect, useRef } from "react";
import classNames from "classnames";
import { useHeyGen, AvatarSessionState } from "./HeyGenContext";
import styles from "./HeyGenAvatar.module.css";

export interface HeyGenAvatarProps {
  /** Optional class name */
  className?: string;
  /** Fallback image to show while loading or if avatar fails */
  fallbackImage?: string;
  /** Alt text for the avatar */
  alt?: string;
  /**
   * Show a placeholder div instead of the real avatar.
   * Useful for development to avoid HeyGen API calls.
   */
  placeholder?: boolean;
}

export const HeyGenAvatar: React.FC<HeyGenAvatarProps> = ({
  className,
  fallbackImage = "/images/hey-gen-placeholder.png",
  alt = "Ashley, your BetterSleep AI Coach",
  placeholder = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { sessionState, stream, error } = useHeyGen();

  // Attach stream to video element when it becomes available
  // This hook must be called before any conditional returns
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch(console.error);
      };
    }
  }, [stream]);

  // Placeholder mode - shows a styled div matching avatar dimensions
  if (placeholder) {
    return (
      <div className={classNames(styles.avatarContainer, className)}>
        <div className={styles.placeholder}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fallbackImage} alt={alt} className={styles.avatarImage} />
          <div className={styles.placeholderLabel}>Avatar Placeholder</div>
        </div>
      </div>
    );
  }

  const isConnected = sessionState === AvatarSessionState.CONNECTED;
  const isConnecting = sessionState === AvatarSessionState.CONNECTING;

  return (
    <div className={classNames(styles.avatarContainer, className)}>
      {/* Show video when connected */}
      {isConnected && stream && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={styles.avatarVideo}
        >
          <track kind="captions" />
        </video>
      )}

      {/* Show fallback image when not connected */}
      {!isConnected && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={fallbackImage}
          alt={alt}
          className={classNames(styles.avatarImage, {
            [styles.loading]: isConnecting,
          })}
        />
      )}

      {/* Loading indicator */}
      {isConnecting && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner} />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className={styles.errorMessage}>Unable to connect to avatar</div>
      )}
    </div>
  );
};
