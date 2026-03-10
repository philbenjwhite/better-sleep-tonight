"use client";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import styles from "./page.module.css";

export default function ThankYouPage() {
  return (
    <>
      <Header showVolumeButton={false} />
      <main className={styles.container}>
        <h1 className={styles.heading}>You&apos;re All Set!</h1>
        <p className={styles.message}>
          In about 5 minutes, you&apos;ll receive a personalized sleep report that
          you can take along to your nearest Ashley store to make your
          Tempur-Pedic rest test easy and stress free. You&apos;re just one mattress
          away from getting a better night&apos;s sleep. Thanks for visiting!
        </p>
      </main>
      <Footer />
    </>
  );
}
