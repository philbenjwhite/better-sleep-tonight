'use client';

import { useMemo } from 'react';
import { ConnectionQuality } from '@/hooks/useNetworkStatus';

export type VideoQualityTier = 'high' | 'medium' | 'low' | 'poster';

interface AdaptiveVideoSource {
  src: string;
  qualityTier: VideoQualityTier;
  isPosterOnly: boolean;
}

/**
 * Get the appropriate video source based on connection quality
 * Assumes video files follow naming convention:
 * - High: video.mp4
 * - Medium: video-medium.mp4
 * - Low: video-low.mp4
 * - Poster: video-poster.jpg
 */
function getVideoSourceForQuality(
  basePath: string,
  quality: ConnectionQuality,
  hasMediumQuality: boolean = false,
  hasLowQuality: boolean = false
): AdaptiveVideoSource {
  const extension = basePath.split('.').pop() || 'mp4';
  const pathWithoutExt = basePath.replace(`.${extension}`, '');

  switch (quality) {
    case ConnectionQuality.FAST:
      return {
        src: basePath,
        qualityTier: 'high',
        isPosterOnly: false,
      };

    case ConnectionQuality.MODERATE:
      if (hasMediumQuality) {
        return {
          src: `${pathWithoutExt}-medium.${extension}`,
          qualityTier: 'medium',
          isPosterOnly: false,
        };
      }
      // Fall back to original if no medium quality available
      return {
        src: basePath,
        qualityTier: 'high',
        isPosterOnly: false,
      };

    case ConnectionQuality.SLOW:
      if (hasLowQuality) {
        return {
          src: `${pathWithoutExt}-low.${extension}`,
          qualityTier: 'low',
          isPosterOnly: false,
        };
      }
      if (hasMediumQuality) {
        return {
          src: `${pathWithoutExt}-medium.${extension}`,
          qualityTier: 'medium',
          isPosterOnly: false,
        };
      }
      // Fall back to original
      return {
        src: basePath,
        qualityTier: 'high',
        isPosterOnly: false,
      };

    case ConnectionQuality.OFFLINE:
      return {
        src: `${pathWithoutExt}-poster.jpg`,
        qualityTier: 'poster',
        isPosterOnly: true,
      };

    default:
      return {
        src: basePath,
        qualityTier: 'high',
        isPosterOnly: false,
      };
  }
}

interface UseAdaptiveVideoOptions {
  basePath: string;
  quality: ConnectionQuality;
  saveData?: boolean;
  hasMediumQuality?: boolean;
  hasLowQuality?: boolean;
  forcePosterOnly?: boolean;
}

interface UseAdaptiveVideoReturn extends AdaptiveVideoSource {
  posterPath: string;
}

/**
 * Hook for selecting appropriate video quality based on network conditions
 */
export function useAdaptiveVideo({
  basePath,
  quality,
  saveData = false,
  hasMediumQuality = false,
  hasLowQuality = false,
  forcePosterOnly = false,
}: UseAdaptiveVideoOptions): UseAdaptiveVideoReturn {
  return useMemo(() => {
    const extension = basePath.split('.').pop() || 'mp4';
    const pathWithoutExt = basePath.replace(`.${extension}`, '');
    const posterPath = `${pathWithoutExt}-poster.jpg`;

    // Force poster-only mode if save data is enabled or explicitly requested
    if (forcePosterOnly || saveData) {
      return {
        src: posterPath,
        qualityTier: 'poster',
        isPosterOnly: true,
        posterPath,
      };
    }

    const source = getVideoSourceForQuality(basePath, quality, hasMediumQuality, hasLowQuality);

    return {
      ...source,
      posterPath,
    };
  }, [basePath, quality, saveData, hasMediumQuality, hasLowQuality, forcePosterOnly]);
}

/**
 * Determine preloading strategy based on connection quality
 */
export function getPreloadStrategy(quality: ConnectionQuality): {
  preloadCount: number;
  preloadAttribute: 'none' | 'metadata' | 'auto';
} {
  switch (quality) {
    case ConnectionQuality.FAST:
      return { preloadCount: 2, preloadAttribute: 'auto' };
    case ConnectionQuality.MODERATE:
      return { preloadCount: 1, preloadAttribute: 'metadata' };
    case ConnectionQuality.SLOW:
      return { preloadCount: 0, preloadAttribute: 'none' };
    case ConnectionQuality.OFFLINE:
      return { preloadCount: 0, preloadAttribute: 'none' };
    default:
      return { preloadCount: 1, preloadAttribute: 'metadata' };
  }
}
