'use client';

import { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import styles from './VideoBackground.module.css';

export interface VideoBackgroundProps {
  /**
   * Video source URLs - WebM first for best performance
   */
  sources: {
    webm: string;
    mp4: string;
    webmMobile?: string;
    mp4Mobile?: string;
  };
  /**
   * Poster image (shown before video loads)
   */
  poster: string;
  /**
   * Alternative text for accessibility
   */
  alt?: string;
  /**
   * Overlay opacity (0-1)
   */
  overlayOpacity?: number;
  /**
   * Overlay color (hex or rgb)
   */
  overlayColor?: string;
  /**
   * Content to display over the video
   */
  children?: React.ReactNode;
  /**
   * Custom className for additional styling
   */
  className?: string;
  /**
   * Video playback speed (default: 1)
   */
  playbackRate?: number;
  /**
   * Enable lazy loading (start playing when in viewport)
   */
  lazy?: boolean;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({
  sources,
  poster,
  alt = 'Background video',
  overlayOpacity = 0.3,
  overlayColor = '#000000',
  children,
  className,
  playbackRate = 1,
  lazy = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [shouldPlay, setShouldPlay] = useState(!lazy);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Check if mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldPlay(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [lazy]);

  // Handle video playback
  useEffect(() => {
    if (!videoRef.current || !shouldPlay || prefersReducedMotion) return;

    const video = videoRef.current;
    video.playbackRate = playbackRate;

    const playPromise = video.play();

    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.warn('Video autoplay failed:', error);
        setHasError(true);
      });
    }
  }, [shouldPlay, playbackRate, prefersReducedMotion]);

  // Handle video loaded state
  const handleCanPlay = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    console.error('Video failed to load');
    setHasError(true);
  };

  // Determine which video sources to use based on screen size
  const webmSrc = isMobile && sources.webmMobile ? sources.webmMobile : sources.webm;
  const mp4Src = isMobile && sources.mp4Mobile ? sources.mp4Mobile : sources.mp4;

  return (
    <div ref={containerRef} className={classNames(styles.container, className)}>
      {/* Video Element */}
      {!prefersReducedMotion && (
        <video
          ref={videoRef}
          className={classNames(styles.video, {
            [styles.videoLoaded]: isLoaded,
            [styles.videoError]: hasError,
          })}
          poster={poster}
          muted
          loop
          playsInline
          preload="metadata"
          onCanPlay={handleCanPlay}
          onError={handleError}
          aria-label={alt}
        >
          <source src={webmSrc} type="video/webm" />
          <source src={mp4Src} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}

      {/* Static poster for reduced motion preference */}
      {prefersReducedMotion && (
        <div
          className={styles.staticPoster}
          style={{ backgroundImage: `url(${poster})` }}
          role="img"
          aria-label={alt}
        />
      )}

      {/* Overlay */}
      <div
        className={styles.overlay}
        style={{
          backgroundColor: overlayColor,
          opacity: overlayOpacity,
        }}
        aria-hidden="true"
      />

      {/* Content */}
      {children && <div className={styles.content}>{children}</div>}

      {/* Loading indicator */}
      {!isLoaded && !hasError && !prefersReducedMotion && (
        <div className={styles.loading} aria-live="polite" aria-busy="true">
          <div className={styles.spinner} role="status">
            <span className={styles.srOnly}>Loading video...</span>
          </div>
        </div>
      )}
    </div>
  );
};
