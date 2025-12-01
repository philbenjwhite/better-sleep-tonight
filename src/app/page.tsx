'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/Button';
import { QuestionBlock, CMSAnswerOption, CMSQuestionContent } from '@/components/QuestionBlock';
import styles from './page.module.css';

// Import flow data from CMS
import backPainFlow from '../../content/flows/back-pain-flow.json';

// Type for flow steps
interface FlowStep {
  stepId: string;
  stepType: string;
  questionContent?: CMSQuestionContent;
}

export default function Home() {
  const [currentView, setCurrentView] = useState<'intro' | 'question'>('intro');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showQuestionBlock, setShowQuestionBlock] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<CMSAnswerOption | null>(null);
  const [avatarResponse, setAvatarResponse] = useState<string | null>(null);
  const [isShowingResponse, setIsShowingResponse] = useState(false);
  const [hasShownIntro, setHasShownIntro] = useState(false);

  // Get the current question step from CMS (skip header, find first question)
  const questionSteps = (backPainFlow.steps as FlowStep[]).filter(step => step.stepType === 'question');
  const currentStep = questionSteps[currentStepIndex];

  const handleBegin = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentView('question');
      setIsTransitioning(false);
    }, 500); // Match CSS transition duration
  };

  // Show question block after Ashley's speech animation completes
  useEffect(() => {
    if (currentView === 'question' && !hasShownIntro) {
      // Wait for speech animation to complete (43 words at 0.1s each + buffer)
      const timer = setTimeout(() => {
        setShowQuestionBlock(true);
        setHasShownIntro(true);
      }, 5500);
      return () => clearTimeout(timer);
    }
  }, [currentView, hasShownIntro]);

  const handleAnswerSelect = (option: CMSAnswerOption) => {
    setSelectedAnswer(option);
    console.log('Selected:', option);
    console.log('Sarah says:', option.avatarResponse);

    // Step 1: Show selection animation briefly
    setTimeout(() => {
      // Step 2: Hide question block and show avatar response
      const response = option.avatarResponse || 'Great choice! Let me ask you another question.';
      setShowQuestionBlock(false);
      setAvatarResponse(response);
      setIsShowingResponse(true);

      // Calculate response duration based on word count (200ms per word + base time)
      const wordCount = response.split(' ').length;
      const responseDuration = Math.max(2500, wordCount * 200 + 1500);

      // Step 3: After response finishes, show next question
      setTimeout(() => {
        setIsShowingResponse(false);
        setAvatarResponse(null);
        setSelectedAnswer(null);

        if (currentStepIndex < questionSteps.length - 1) {
          setCurrentStepIndex(prev => prev + 1);
          // Small delay before showing next question
          setTimeout(() => {
            setShowQuestionBlock(true);
          }, 300);
        } else {
          // End of flow - could navigate to results
          console.log('Flow complete!');
        }
      }, responseDuration);
    }, 1800); // Pause after selection to show dimmed options
  };

  return (
    <main className={styles.main}>
      {/* Video Background - only show on intro */}
      {currentView === 'intro' && (
        <>
          <video
            className={`${styles.videoBackground} ${isTransitioning ? styles.fadeOut : ''}`}
            autoPlay
            loop
            muted
            playsInline
            controls={false}
          >
            <source src="/videos/Mattress_Shopping.mp4" type="video/mp4" />
          </video>

          {/* Gradient Overlay */}
          <div className={`${styles.gradientOverlay} ${isTransitioning ? styles.fadeOut : ''}`} />
        </>
      )}

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

      {/* Intro View */}
      {currentView === 'intro' && (
        <div className={`${styles.contentWrapper} ${isTransitioning ? styles.fadeOut : styles.fadeIn}`}>
          <div className={styles.contentInner}>
            {/* Avatar */}
            <div className={styles.avatarContainer}>
              <Image
                src="/images/avatar-2x.png"
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
              <Button variant="primary" size="large" onClick={handleBegin}>
                Let&apos;s Begin
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Question View */}
      {currentView === 'question' && (
        <>
          {/* Full-width Gradient Overlay at Bottom */}
          <div className={styles.avatarGradientOverlay} />

          <div className={`${styles.questionWrapper} ${isTransitioning ? styles.fadeOut : styles.fadeIn}`}>
            {/* HeyGen Avatar Wrapper */}
            <div className={styles.heygenWrapper}>
              <img
                src="/images/hey-gen-placeholder.png"
                alt="Ashley, your BetterSleep AI Coach"
                className={styles.heygenAvatar}
              />

              {/* Speech Bubble - intro message (only show once, before first question) */}
              {!hasShownIntro && !showQuestionBlock && !isShowingResponse && !avatarResponse && (
                <div className={styles.speechBubble}>
                  <p className={styles.speechText}>
                    {`Hey, I'm Ashley — your virtual sleep guide. My job is simple: helping you wake up clear, refreshed, and pain‑free. If sleep hasn't been treating you right, you're not alone. The good news? You're in the right place to fix it.`.split(' ').map((word, index) => (
                      <span
                        key={index}
                        className={index < 4 ? styles.introWord : `${styles.introWord} ${styles.speechTextSecondary}`}
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        {word}{' '}
                      </span>
                    ))}
                  </p>
                </div>
              )}

              {/* Avatar Response Bubble - shows after answer selection */}
              {isShowingResponse && avatarResponse && (
                <div className={styles.responseBubble}>
                  <p className={styles.responseText}>
                    {avatarResponse.split(' ').map((word, index) => (
                      <span
                        key={index}
                        className={styles.responseWord}
                        style={{ animationDelay: `${index * 0.12}s` }}
                      >
                        {word}{' '}
                      </span>
                    ))}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Question Block - OUTSIDE heygenWrapper so blur works */}
          {showQuestionBlock && currentStep?.questionContent && (
            <div className={styles.questionBlockWrapper}>
              <div className={styles.questionBlockBackdrop} />
              <div className={styles.questionBlockInner}>
                <QuestionBlock
                  questionContent={currentStep.questionContent}
                  onAnswerSelect={handleAnswerSelect}
                  selectedValue={selectedAnswer?.value}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <footer className={styles.footer}>
        <p className={styles.copyright}>
          © 2025 BetterSleep Tonight. All rights reserved.
        </p>
        <p className={styles.privacyPolicy}>
          Privacy Policy
        </p>
      </footer>
    </main>
  );
}
