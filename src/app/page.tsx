import Image from 'next/image';
import { Button } from '@/components/Button';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      {/* Video Background */}
      <video
        className={styles.videoBackground}
        autoPlay
        loop
        muted
        playsInline
        controls={false}
      >
        <source src="/videos/Mattress_Shopping.mp4" type="video/mp4" />
      </video>

      {/* Gradient Overlay */}
      <div className={styles.gradientOverlay} />

      {/* Logo - Top Left */}
      <div className={styles.logo}>
        <Image
          src="/images/logo.svg"
          alt="Ashley BetterSleep Shop"
          width={216}
          height={111}
          priority
        />
      </div>

      {/* Volume Icon - Top Right */}
      <button className={styles.volumeButton} aria-label="Toggle audio">
        <Image
          src="/images/volume-icon.svg"
          alt=""
          width={20}
          height={20}
        />
      </button>

      {/* Main Content */}
      <div className={styles.contentWrapper}>
        <div className={styles.contentInner}>
          {/* Avatar */}
          <div className={styles.avatarContainer}>
            <Image
              src="/images/avatar@2x.png"
              alt="Anna, your BetterSleep AI Coach"
              width={220}
              height={220}
              className={styles.avatar}
              priority
            />
          </div>

          {/* Text Content */}
          <div className={styles.textContent}>
            <h1 className={styles.titlePage}>
              Find Your Perfect Mattress
            </h1>
            <p className={styles.heading}>
              Meet Anna, your BetterSleep™ AI Coach. She&apos;ll guide you through 3 quick questions to recommend the ideal mattress for your sleep style.
            </p>
          </div>

          {/* CTA Section */}
          <div className={styles.ctaSection}>
            <p className={styles.audioNotice}>
              For best experience please have your audio turned on
            </p>
            <Button variant="primary" size="large">
              Let&apos;s Begin
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <p className={styles.copyright}>
          © 2025 BetterSleep Shop. All rights reserved.
        </p>
        <p className={styles.privacyPolicy}>
          Privacy Policy
        </p>
      </footer>
    </main>
  );
}
