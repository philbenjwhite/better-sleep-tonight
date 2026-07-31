"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SpeechBubbleSequence } from "@/components/SpeechBubbleSequence";
import type { SubtitleCue } from "@/components/SpeechBubbleSequence";
import { parseVtt } from "@/lib/subtitles";
import { PROGRESS_STORAGE_KEY } from "@/hooks";
import { BOOK_APPOINTMENT_URL } from "@/config/constants";
import { trackBookAppointmentClick } from "@/lib/analytics";
import styles from "./page.module.css";

const VIDEO_SRC = "/videos/ashley/ashley-thank-you.mp4";
const VTT_SRC = "/videos/ashley/ashley-thank-you.vtt";

export default function ThankYouPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [subtitleCues, setSubtitleCues] = useState<SubtitleCue[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

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
    if (videoRef.current) {
      const { currentTime: time, duration } = videoRef.current;
      setCurrentTime(time);
      // Pause 0.5s before end to freeze on last frame (timeupdate fires ~every 250ms)
      if (duration && time >= duration - 0.5 && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    }
  }, []);

  // Safety net: if video reaches end despite pause attempt, seek back to last frame
  const handleEnded = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = videoRef.current.duration - 0.5;
      videoRef.current.pause();
    }
  }, []);

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
                src={VIDEO_SRC}
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

              {/*
                The booking hand-off. Deliberately outside the subtitleCues
                guard above: if the VTT fetch fails there is still a way to
                book, which is the whole point of this page.
              */}
              <div className={styles.ctaGroup}>
                <a
                  href={BOOK_APPOINTMENT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.ctaButton}
                  onClick={() => trackBookAppointmentClick("thank_you_page")}
                >
                  Book a Rest Test
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
