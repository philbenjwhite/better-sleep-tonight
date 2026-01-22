'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useVideoAvatar } from '@/components/VideoAvatar';
import { parseVtt, SubtitleCue } from '@/lib/subtitles';

interface UseSubtitleSyncOptions {
  /** URL to VTT file */
  vttUrl: string | null;
  /** Enable/disable sync (default: true) */
  enabled?: boolean;
  /** Called when VTT fails to load */
  onLoadError?: () => void;
}

interface UseSubtitleSyncReturn {
  /** Cues that should be visible at currentTime */
  visibleCues: SubtitleCue[];
  /** All parsed cues */
  allCues: SubtitleCue[];
  /** Whether VTT is loading */
  isLoading: boolean;
  /** Whether subtitles loaded successfully */
  hasSubtitles: boolean;
  /** Index of most recent visible cue */
  currentCueIndex: number;
}

export function useSubtitleSync({
  vttUrl,
  enabled = true,
  onLoadError,
}: UseSubtitleSyncOptions): UseSubtitleSyncReturn {
  const { currentTime } = useVideoAvatar();
  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubtitles, setHasSubtitles] = useState(false);

  const onLoadErrorCallback = useCallback(() => {
    onLoadError?.();
  }, [onLoadError]);

  // Fetch and parse VTT file
  useEffect(() => {
    if (!vttUrl || !enabled) {
      setCues([]);
      setHasSubtitles(false);
      return;
    }

    setIsLoading(true);
    fetch(vttUrl)
      .then((res) => {
        if (!res.ok) throw new Error('VTT not found');
        return res.text();
      })
      .then((content) => {
        const track = parseVtt(content);
        setCues(track.cues);
        setHasSubtitles(track.cues.length > 0);
        setIsLoading(false);
      })
      .catch(() => {
        setCues([]);
        setHasSubtitles(false);
        setIsLoading(false);
        onLoadErrorCallback();
      });
  }, [vttUrl, enabled, onLoadErrorCallback]);

  // Calculate which cues should be visible based on currentTime
  const { visibleCues, currentCueIndex } = useMemo(() => {
    if (!hasSubtitles || !enabled || cues.length === 0) {
      return { visibleCues: [], currentCueIndex: -1 };
    }

    // Find all cues where startTime <= currentTime
    const visible = cues.filter((cue) => cue.startTime <= currentTime);
    const lastIndex = visible.length - 1;

    return {
      visibleCues: visible,
      currentCueIndex: lastIndex,
    };
  }, [cues, currentTime, hasSubtitles, enabled]);

  return {
    visibleCues,
    allCues: cues,
    isLoading,
    hasSubtitles,
    currentCueIndex,
  };
}
