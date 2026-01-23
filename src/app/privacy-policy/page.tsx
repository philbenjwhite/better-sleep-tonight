'use client';

import { useRouter } from 'next/navigation';
import { X } from '@phosphor-icons/react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import styles from './page.module.css';

export default function PrivacyPolicy() {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  return (
    <main className={styles.main}>
      <Header brandName="BetterSleep Tonight" showVolumeButton={false} />

      {/* Close button */}
      <button
        className={styles.closeButton}
        onClick={handleClose}
        aria-label="Close and go back"
        title="Close"
      >
        <X size={24} weight="bold" color="#363534" />
      </button>

      <div className={styles.content}>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.lastUpdated}>Last updated: January 1, 2025</p>

        <section className={styles.section}>
          <h2>1. Introduction</h2>
          <p>
            Welcome to BetterSleep Tonight (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting
            your personal information and your right to privacy. This Privacy Policy explains how we
            collect, use, disclose, and safeguard your information when you use our website and services.
          </p>
        </section>

        <section className={styles.section}>
          <h2>2. Information We Collect</h2>
          <p>We may collect information about you in a variety of ways, including:</p>
          <ul>
            <li><strong>Personal Data:</strong> Name, email address, and other contact information you provide.</li>
            <li><strong>Usage Data:</strong> Information about how you interact with our services.</li>
            <li><strong>Device Information:</strong> Browser type, operating system, and device identifiers.</li>
            <li><strong>Sleep Assessment Data:</strong> Responses you provide during our sleep assessment questionnaire.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, operate, and maintain our services</li>
            <li>Personalize your sleep recommendations</li>
            <li>Improve and develop new features</li>
            <li>Communicate with you about updates and promotions</li>
            <li>Ensure the security of our services</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>4. Sharing Your Information</h2>
          <p>
            We do not sell your personal information. We may share your information with third-party
            service providers who assist us in operating our website, conducting our business, or
            serving our users, so long as those parties agree to keep this information confidential.
          </p>
        </section>

        <section className={styles.section}>
          <h2>5. Data Security</h2>
          <p>
            We implement appropriate technical and organizational security measures to protect your
            personal information. However, no method of transmission over the Internet or electronic
            storage is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section className={styles.section}>
          <h2>6. Your Rights</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul>
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Opt out of marketing communications</li>
            <li>Withdraw consent where applicable</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>7. Cookies and Tracking</h2>
          <p>
            We use cookies and similar tracking technologies to track activity on our website and
            hold certain information. You can instruct your browser to refuse all cookies or to
            indicate when a cookie is being sent.
          </p>
        </section>

        <section className={styles.section}>
          <h2>8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes
            by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
          </p>
        </section>

        <section className={styles.section}>
          <h2>9. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <p className={styles.contactInfo}>
            Email: privacy@bettersleeptonight.com<br />
            Address: [Your Business Address]
          </p>
        </section>
      </div>

      <Footer />
    </main>
  );
}
