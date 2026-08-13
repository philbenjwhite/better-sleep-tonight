"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SpeechBubbleSequence } from "@/components/SpeechBubbleSequence";
import type { SubtitleCue } from "@/components/SpeechBubbleSequence";
import { parseVtt } from "@/lib/subtitles";
import { PROGRESS_STORAGE_KEY } from "@/hooks";
import styles from "./page.module.css";

const VIDEO_SRC = "/videos/ashley/ashley-thank-you.mp4";
const VTT_SRC = "/videos/ashley/ashley-thank-you.vtt";
// The same loop the booking step hands off to when its segment ends.
const IDLE_SRC = "/videos/ashley/ashley-idle-crf28.mp4";

export default function ThankYouPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [subtitleCues, setSubtitleCues] = useState<SubtitleCue[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isIdle, setIsIdle] = useState(false);

  // Load and parse VTT
  useEffect(() => {
    fetch(VTT_SRC)
      .then((res) => res.text())
      .then((content) => {
        const track = parseVtt(content);
        setSubtitleCues(
          track.cues.map((c) => ({
            startTime: c.startTime,
            endTime: c.endTime,
            text: c.text,
          })),
        );
      })
      .catch(() => {});
  }, []);

  // Clear quiz progress so returning to / won't show the resume modal.
  // Must match STORAGE_KEY in useProgressPersistence: this cleared the pre-v2
  // key, so finishers kept valid progress pointing at the booking step and were
  // offered "continue where you left off" back onto it. Guarded because Safari
  // with "Block All Cookies" throws from the localStorage getter itself.
  useEffect(() => {
    try {
      localStorage.removeItem(PROGRESS_STORAGE_KEY);
    } catch {
      /* storage unavailable — nothing to clear */
    }
  }, []);

  // Auto-play video on mount
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {
      video.muted = true;
      setIsMuted(true);
      video.play().catch(() => {});
    });
  }, []);

  const handleTimeUpdate = useCallback(() => {
    // The idle loop restarts its clock on every pass and the speech bubble is
    // driven off that clock, so leave it wherever the closing segment finished.
    // Otherwise the bubble snaps back to its first line each time the loop wraps.
    if (isIdle) return;
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);

    // Hand off before the end rather than on it. The recording finishes on
    // three black frames — 0.1s of them, baked into the file — and playing it
    // out to `ended` puts them on screen every time. The margin clears them
    // with room for timeupdate's ~0.25s of jitter, and costs a fraction of a
    // second of a shot that is already still. See STOP_BEFORE_END_SECONDS in
    // VideoAvatarContext, which is the same number for the same reason.
    if (video.duration && video.currentTime >= video.duration - 0.4) {
      setIsIdle(true);
    }
  }, [isIdle]);

  /**
   * Hand off to the looping idle clip, the same way the booking step does when
   * its segment ends.
   *
   * This used to rewind half a second and freeze on that frame. It only ever
   * worked by luck: it parked on whatever the final moment of the recording
   * happened to contain, which was fine for the 20s original but lands mid
   * glance-down on the shorter August 2026 re-record. Any future re-record
   * would have rolled the same dice.
   *
   * The hand-off normally happens in handleTimeUpdate, before the end. This is
   * the backstop for a segment whose end arrives without one — a browser that
   * stops firing timeupdate on a backgrounded tab, or a duration that never
   * resolves.
   */
  const handleEnded = useCallback(() => {
    setIsIdle(true);
  }, []);

  useEffect(() => {
    if (!isIdle) return;
    videoRef.current?.play().catch(() => {
      /* the closing frame stays up if the loop will not start */
    });
  }, [isIdle]);

  // Warm the idle clip while the closing segment is still playing. Without it
  // the swap waits on a cold request and holds the segment's final frame while
  // it loads, which is the frame this handoff exists to get off the screen.
  useEffect(() => {
    if (!hasStarted) return;
    const abort = new AbortController();
    fetch(IDLE_SRC, { signal: abort.signal })
      .then((res) => res.blob())
      .catch(() => {
        /* falls back to loading at swap time */
      });
    return () => abort.abort();
  }, [hasStarted]);

  const handlePlay = useCallback(() => {
    if (!hasStarted) setHasStarted(true);
  }, [hasStarted]);

  const handleToggleMute = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  // Build full message from cues for SpeechBubbleSequence
  const message = subtitleCues.map((c) => c.text).join("\n\n");

  return (
    <>
      <Header
        showVolumeButton
        isMuted={isMuted}
        onVolumeClick={handleToggleMute}
      />
      <main id="main-content" className={styles.container}>
        <div className={styles.questionWrapper}>
          <div className={styles.avatarGradientOverlay} />
          <div className={styles.avatarWrapper}>
            <h1 className={styles.headingMobile}>
              Thanks, You&apos;re All Set!
            </h1>

            <div className={styles.avatarContainer}>
              <video
                ref={videoRef}
                className={styles.avatarVideo}
                src={isIdle ? IDLE_SRC : VIDEO_SRC}
                loop={isIdle}
                playsInline
                muted={isMuted}
                onTimeUpdate={handleTimeUpdate}
                onPlay={handlePlay}
                onEnded={handleEnded}
              />
            </div>

            <div className={styles.rightPanel}>
              <h1 className={styles.headingDesktop}>
                Thanks, You&apos;re All Set!
              </h1>
              {/*
                Not gated on playback. This required the video to have started,
                so a device that refuses autoplay (Low Power Mode, Auto-Play:
                Never) left the page with a heading and nothing else. When
                playback did start the copy stays synced to the audio; when it
                did not, it falls back to the untimed reveal so the message is
                still readable.
              */}
              {subtitleCues.length > 0 && (
                <SpeechBubbleSequence
                  key="thank-you-speech"
                  message={message}
                  wordDelay={0.15}
                  paragraphPauseMs={600}
                  className={styles.speechBubbleContainer}
                  stayVisible
                  subtitleCues={hasStarted ? subtitleCues : undefined}
                  videoCurrentTime={hasStarted ? currentTime : undefined}
                />
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
