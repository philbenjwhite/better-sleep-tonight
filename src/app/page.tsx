"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/Button";
import {
  QuestionBlock,
  CMSAnswerOption,
  CMSQuestionContent,
} from "@/components/QuestionBlock";
import {
  HeyGenProvider,
  HeyGenAvatar,
  useHeyGen,
  AvatarSessionState,
} from "@/components/HeyGenAvatar";
import { DevPanel, StoredAnswer } from "@/components/DevPanel";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SpeechBubbleSequence } from "@/components/SpeechBubbleSequence";
import { RecoveryModal } from "@/components/RecoveryModal";
import { useProgressPersistence } from "@/hooks";
import styles from "./page.module.css";

// Import flow data from CMS
import wakeUpRestedFlow from "../../content/flows/wake-up-rested-flow.json";
import backPainFlow from "../../content/flows/back-pain-flow.json";

// Flow registry - maps URL param to flow data
const FLOWS: Record<string, typeof wakeUpRestedFlow> = {
  default: wakeUpRestedFlow,
  sleep: wakeUpRestedFlow,
  "back-pain": backPainFlow,
};

// Type for flow steps
interface FlowStep {
  stepId: string;
  stepType: string;
  questionContent?: CMSQuestionContent;
  headerContent?: {
    headline: string;
    subheadline: string;
    subheadlineSecondary?: string;
    avatarIntroScript: string;
    primaryButtonText: string;
    primaryButtonAction: string;
    audioNotice?: string;
  };
}

function HomeContent() {
  const searchParams = useSearchParams();

  // Flow selection: ?flow=back-pain, ?flow=sleep, etc.
  const flowParam = searchParams.get("flow") || "default";
  const activeFlow = FLOWS[flowParam] || FLOWS["default"];

  // Dev: ?step=N to skip directly to question N (1-indexed)
  const stepParam = searchParams.get("step");
  const initialStep = stepParam ? Math.max(0, parseInt(stepParam, 10) - 1) : 0;
  const skipIntro = stepParam !== null;

  // Progress persistence
  const {
    savedProgress,
    hasSavedProgress,
    saveProgress,
    clearProgress,
    isLoading: isLoadingProgress,
  } = useProgressPersistence();

  const [currentView, setCurrentView] = useState<"intro" | "question">(
    skipIntro ? "question" : "intro"
  );
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(false);
  const [showQuestionBlock, setShowQuestionBlock] = useState(skipIntro);
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStep);
  const [selectedAnswer, setSelectedAnswer] = useState<CMSAnswerOption | null>(
    null
  );
  const [avatarResponse, setAvatarResponse] = useState<string | null>(null);
  const [isShowingResponse, setIsShowingResponse] = useState(false);
  const [hasShownIntro, setHasShownIntro] = useState(skipIntro);
  const [hasSpokenIntro, setHasSpokenIntro] = useState(skipIntro);
  const [avatarStartedTalking, setAvatarStartedTalking] = useState(false);
  const [storedAnswers, setStoredAnswers] = useState<StoredAnswer[]>([]);
  const [isMuted, setIsMuted] = useState(true); // Muted by default
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [hasHandledRecovery, setHasHandledRecovery] = useState(skipIntro);

  // HeyGen avatar hook
  const { sessionState, isAvatarTalking, initializeAvatar, speak } =
    useHeyGen();

  // Dev mode: auto-initialize avatar when skipping intro
  useEffect(() => {
    if (skipIntro && sessionState === AvatarSessionState.INACTIVE) {
      initializeAvatar();
    }
  }, [skipIntro, sessionState, initializeAvatar]);

  // Show recovery modal if saved progress exists (and matches current flow)
  useEffect(() => {
    if (
      !isLoadingProgress &&
      hasSavedProgress &&
      !hasHandledRecovery &&
      savedProgress &&
      savedProgress.flowId === flowParam &&
      currentView === "intro"
    ) {
      setShowRecoveryModal(true);
    }
  }, [
    isLoadingProgress,
    hasSavedProgress,
    hasHandledRecovery,
    savedProgress,
    flowParam,
    currentView,
  ]);

  // Handle continuing from saved progress
  const handleContinueProgress = useCallback(() => {
    if (savedProgress) {
      setStoredAnswers(savedProgress.answers);
      setCurrentStepIndex(savedProgress.currentStepIndex);
      setShowRecoveryModal(false);
      setHasHandledRecovery(true);
      setHasShownIntro(true);
      setHasSpokenIntro(true);

      // Go directly to question view
      setIsTransitioning(true);
      setIsLoadingAvatar(true);
      setIsMuted(false);
      initializeAvatar();

      setTimeout(() => {
        setCurrentView("question");
        setIsTransitioning(false);
        // Show question block immediately since we're restoring
        setTimeout(() => setShowQuestionBlock(true), 500);
      }, 500);
    }
  }, [savedProgress, initializeAvatar]);

  // Handle starting fresh
  const handleStartFresh = useCallback(() => {
    clearProgress();
    setShowRecoveryModal(false);
    setHasHandledRecovery(true);
  }, [clearProgress]);

  // Track when avatar starts talking (to know when it's safe to check for stop)
  useEffect(() => {
    if (isAvatarTalking) {
      setAvatarStartedTalking(true);
    }
  }, [isAvatarTalking]);

  // Get flow data from CMS (uses activeFlow based on ?flow= param)
  const flowSteps = activeFlow.steps as FlowStep[];
  const headerStep = flowSteps.find((step) => step.stepType === "header");
  const questionSteps = flowSteps.filter(
    (step) => step.stepType === "question"
  );
  const currentStep = questionSteps[currentStepIndex];
  const introVideo =
    (activeFlow as typeof wakeUpRestedFlow & { introVideo?: string })
      .introVideo || "/videos/Mattress_Shopping.mp4";

  // Get intro message from CMS
  const introMessage = headerStep?.headerContent?.avatarIntroScript || "";

  // Avatar is ready when connected
  const isAvatarReady = sessionState === AvatarSessionState.CONNECTED;

  const handleBegin = useCallback(async () => {
    setIsTransitioning(true);
    setIsLoadingAvatar(true);
    setIsMuted(false); // Unmute when user clicks "Let's Begin"

    // Start initializing the avatar
    initializeAvatar();

    setTimeout(() => {
      setCurrentView("question");
      setIsTransitioning(false);
    }, 500); // Match CSS transition duration
  }, [initializeAvatar]);

  const handleVolumeToggle = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // Speak intro when avatar is connected
  useEffect(() => {
    if (
      currentView === "question" &&
      isAvatarReady &&
      !hasSpokenIntro &&
      introMessage
    ) {
      setIsLoadingAvatar(false);
      setHasSpokenIntro(true);
      speak(introMessage);
    }
  }, [currentView, isAvatarReady, hasSpokenIntro, speak, introMessage]);

  // Show question block after Ashley finishes speaking intro
  // Only trigger when avatar has started AND stopped talking
  useEffect(() => {
    if (
      currentView === "question" &&
      hasSpokenIntro &&
      avatarStartedTalking &&
      !isAvatarTalking &&
      !hasShownIntro
    ) {
      // Pause after avatar stops talking before showing questions
      const timer = setTimeout(() => {
        setShowQuestionBlock(true);
        setHasShownIntro(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [
    currentView,
    hasSpokenIntro,
    avatarStartedTalking,
    isAvatarTalking,
    hasShownIntro,
  ]);

  const handleAnswerSelect = useCallback(
    (option: CMSAnswerOption) => {
      setSelectedAnswer(option);
      console.log("Selected:", option);
      console.log("Ashley says:", option.avatarResponse);

      // Store the answer
      const newAnswer: StoredAnswer = {
        stepId: currentStep?.stepId || `step-${currentStepIndex}`,
        questionText: currentStep?.questionContent?.questionText || "",
        value: option.value,
        label: option.label,
        timestamp: new Date(),
      };
      const updatedAnswers = [...storedAnswers, newAnswer];
      setStoredAnswers(updatedAnswers);

      // Auto-save progress to localStorage
      saveProgress({
        flowId: flowParam,
        currentStepIndex: currentStepIndex + 1, // Save next step index
        answers: updatedAnswers,
      });

      // Step 1: Show selection animation briefly, then start avatar response
      setTimeout(() => {
        // Step 2: Hide question block and show avatar response
        const response =
          option.avatarResponse ||
          "Great choice! Let me ask you another question.";
        setShowQuestionBlock(false);
        setAvatarResponse(response);
        setIsShowingResponse(true);
        setAvatarStartedTalking(false); // Reset for next speech detection

        // Make the avatar speak the response
        if (sessionState === AvatarSessionState.CONNECTED) {
          speak(response);
        }
      }, 1800); // Pause after selection to show dimmed options
    },
    [sessionState, speak, currentStep, currentStepIndex, storedAnswers, saveProgress, flowParam]
  );

  const handleTextSubmit = useCallback(
    (value: string) => {
      console.log("Text submitted:", value);

      // Store the answer
      const newAnswer: StoredAnswer = {
        stepId: currentStep?.stepId || `step-${currentStepIndex}`,
        questionText: currentStep?.questionContent?.questionText || "",
        value: value,
        label: value,
        timestamp: new Date(),
      };
      const updatedAnswers = [...storedAnswers, newAnswer];
      setStoredAnswers(updatedAnswers);

      // Auto-save progress to localStorage
      saveProgress({
        flowId: flowParam,
        currentStepIndex: currentStepIndex + 1, // Save next step index
        answers: updatedAnswers,
      });

      // Get the avatar response from the current step's questionContent
      const response =
        currentStep?.questionContent?.avatarResponse ||
        "Thank you! Let me continue with the next question.";
      console.log("Ashley says:", response);

      // Hide question block and show avatar response
      setShowQuestionBlock(false);
      setAvatarResponse(response);
      setIsShowingResponse(true);
      setAvatarStartedTalking(false); // Reset for next speech detection

      // Make the avatar speak the response
      if (sessionState === AvatarSessionState.CONNECTED) {
        speak(response);
      }
    },
    [currentStep, currentStepIndex, sessionState, speak, storedAnswers, saveProgress, flowParam]
  );

  // Show next question after avatar finishes speaking response
  useEffect(() => {
    if (isShowingResponse && avatarStartedTalking && !isAvatarTalking) {
      // Avatar finished speaking the response
      const timer = setTimeout(() => {
        setIsShowingResponse(false);
        setAvatarResponse(null);
        setSelectedAnswer(null);
        setAvatarStartedTalking(false);

        if (currentStepIndex < questionSteps.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
          // Small delay before showing next question
          setTimeout(() => {
            setShowQuestionBlock(true);
          }, 300);
        } else {
          // End of flow - could navigate to results
          console.log("Flow complete!");
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [
    isShowingResponse,
    avatarStartedTalking,
    isAvatarTalking,
    currentStepIndex,
    questionSteps.length,
  ]);

  return (
    <main className={styles.main}>
      {/* Video Background - only show on intro */}
      {currentView === "intro" && (
        <>
          <video
            className={`${styles.videoBackground} ${
              isTransitioning ? styles.fadeOut : ""
            }`}
            autoPlay
            loop
            muted
            playsInline
            controls={false}
          >
            <source src={introVideo} type="video/mp4" />
          </video>

          {/* Gradient Overlay */}
          <div
            className={`${styles.gradientOverlay} ${
              isTransitioning ? styles.fadeOut : ""
            }`}
          />
        </>
      )}

      {/* Header with Logo and Volume Button */}
      <Header
        brandName={activeFlow.globalVariables.brandName}
        isMuted={isMuted}
        onVolumeClick={handleVolumeToggle}
      />

      {/* Intro View */}
      {currentView === "intro" && headerStep?.headerContent && (
        <div
          className={`${styles.contentWrapper} ${
            isTransitioning ? styles.fadeOut : styles.fadeIn
          }`}
        >
          <div className={styles.contentInner}>
            {/* Avatar */}
            <div className={styles.avatarContainer}>
              <Image
                src="/images/avatar-2x.png"
                alt={`${activeFlow.globalVariables.avatarName}, your BetterSleep AI Coach`}
                width={220}
                height={220}
                className={styles.avatar}
                priority
              />
            </div>

            {/* Text Content */}
            <div className={styles.textContent}>
              <h1 className={styles.titlePage}>
                {headerStep.headerContent.headline}
              </h1>
              <p className={styles.subheadline}>
                {headerStep.headerContent.subheadline}
                {headerStep.headerContent.subheadlineSecondary && (
                  <>
                    <br />
                    <br />
                    {headerStep.headerContent.subheadlineSecondary}
                  </>
                )}
              </p>
            </div>

            {/* CTA Section */}
            <div className={styles.ctaSection}>
              {headerStep.headerContent.audioNotice && (
                <p className={styles.audioNotice}>
                  {headerStep.headerContent.audioNotice}
                </p>
              )}
              <Button variant="primary" size="large" onClick={handleBegin}>
                {headerStep.headerContent.primaryButtonText}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Question View */}
      {currentView === "question" && (
        <>
          {/* Loading state while avatar initializes */}
          {isLoadingAvatar && (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner} />
              <p className={styles.loadingText}>
                Connecting to {activeFlow.globalVariables.avatarName}...
              </p>
            </div>
          )}

          {/* Only show avatar content once loaded */}
          {isAvatarReady && (
            <>
              {/* Full-width Gradient Overlay at Bottom */}
              <div className={styles.avatarGradientOverlay} />

              <div className={`${styles.questionWrapper} ${styles.fadeIn}`}>
                {/* HeyGen Avatar Wrapper */}
                <div className={styles.heygenWrapper}>
                  <HeyGenAvatar
                    className={styles.heygenAvatar}
                    placeholder={HEYGEN_DEV_MODE}
                    isMuted={isMuted}
                  />

                  {/* Speech Bubble Sequence - intro message (only show once, before first question) */}
                  {!hasShownIntro &&
                    !showQuestionBlock &&
                    !isShowingResponse &&
                    introMessage && (
                      <SpeechBubbleSequence
                        message={introMessage}
                        wordDelay={0.26}
                        paragraphPauseMs={1500}
                        className={styles.speechBubbleContainer}
                      />
                    )}

                  {/* Avatar Response Bubble - shows after answer selection */}
                  {isShowingResponse && avatarResponse && (
                    <SpeechBubbleSequence
                      message={avatarResponse}
                      wordDelay={0.32}
                      paragraphPauseMs={1200}
                      className={styles.speechBubbleContainer}
                    />
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
                      onTextSubmit={handleTextSubmit}
                      selectedValue={selectedAnswer?.value}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Footer with Progress Bar */}
      <Footer
        showProgress={currentView === "question"}
        currentStep={currentStepIndex + 1}
        totalSteps={questionSteps.length}
      />

      {/* Dev Panel - press "/" to toggle */}
      <DevPanel
        answers={storedAnswers}
        currentStep={currentStepIndex + 1}
        totalSteps={questionSteps.length}
      />

      {/* Recovery Modal - shown when user has saved progress */}
      {showRecoveryModal && savedProgress && (
        <RecoveryModal
          savedProgress={savedProgress}
          onContinue={handleContinueProgress}
          onStartFresh={handleStartFresh}
        />
      )}
    </main>
  );
}

// Set to true to skip HeyGen API calls and simulate avatar behavior
const HEYGEN_DEV_MODE = false;

// Wrap with HeyGen Provider and Suspense (required for useSearchParams)
export default function Home() {
  return (
    <Suspense fallback={null}>
      <HeyGenProvider
        avatarName="3f56b148c07141b3b6a3bcd1be26289e"
        devMode={HEYGEN_DEV_MODE}
      >
        <HomeContent />
      </HeyGenProvider>
    </Suspense>
  );
}
