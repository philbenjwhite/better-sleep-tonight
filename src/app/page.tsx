"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/Button";
import {
  AnimatedQuestionBlock,
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
import {
  MattressRecommendation,
  MattressRecommendationContent,
  MattressSize,
  MattressFeel,
} from "@/components/MattressRecommendation";
import {
  ProductRecommendations,
  ProductRecommendationsContent,
} from "@/components/ProductRecommendations";
import { useProgressPersistence } from "@/hooks";
import styles from "./page.module.css";

// Import flow data from CMS
import backPainFlow from "../../content/flows/back-pain-flow.json";
import achesAndPainsFlow from "../../content/flows/achesandpains-flow.json";
import headacheFlow from "../../content/flows/wakeupwithaheadache-flow.json";
import hipPainFlow from "../../content/flows/hippain-flow.json";
import feelingTiredFlow from "../../content/flows/wakeupfeelingtired-flow.json";
import neckPainFlow from "../../content/flows/neckpain-flow.json";
import shoulderPainFlow from "../../content/flows/shoulderpain-flow.json";

// Flow registry - maps URL param to flow data
// eslint-disable-next-line
const FLOWS: Record<string, any> = {
  default: backPainFlow,
  "back-pain": backPainFlow,
  achesandpains: achesAndPainsFlow,
  wakeupwithaheadache: headacheFlow,
  hippain: hipPainFlow,
  wakeupfeelingtired: feelingTiredFlow,
  neckpain: neckPainFlow,
  shoulderpain: shoulderPainFlow,
};

// Type for answer summary mappings
interface AnswerSummaryContent {
  introText: string;
  outroText: string;
  emotion: string;
  summaryMappings: Record<string, Record<string, string>>;
}

// Type for flow steps
interface FlowStep {
  stepId: string;
  stepType: string;
  questionContent?: CMSQuestionContent;
  headerContent?: {
    headline: string;
    subheadline: string;
    secondarySubheadline?: string;
    avatarIntroScript: string;
    primaryButtonText: string;
    audioNotice?: string;
  };
  mattressRecommendationContent?: MattressRecommendationContent;
  answerSummaryContent?: AnswerSummaryContent;
  productRecommendationsContent?: ProductRecommendationsContent;
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
  const [currentEmotion, setCurrentEmotion] = useState<string | null>(null);
  const [isFlowTerminated, setIsFlowTerminated] = useState(false);
  const [terminationMessage, setTerminationMessage] = useState<string | null>(
    null
  );
  const [selectedMattressSize, setSelectedMattressSize] = useState<
    MattressSize | undefined
  >(undefined);
  const [selectedMattressFeel, setSelectedMattressFeel] = useState<
    MattressFeel | undefined
  >(undefined);
  const [hasSpokenSummary, setHasSpokenSummary] = useState(false);
  const [showBackdrop, setShowBackdrop] = useState(false);
  const [backdropHasAnimated, setBackdropHasAnimated] = useState(false);

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
        setTimeout(() => {
          setShowBackdrop(true);
          setBackdropHasAnimated(true);
          setShowQuestionBlock(true);
        }, 500);
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
    (step) =>
      step.stepType === "question" ||
      step.stepType === "mattress-recommendation" ||
      step.stepType === "answer-summary" ||
      step.stepType === "product-recommendations"
  );
  const currentStep = questionSteps[currentStepIndex];
  const isMattressRecommendationStep =
    currentStep?.stepType === "mattress-recommendation";
  const isAnswerSummaryStep = currentStep?.stepType === "answer-summary";
  const isProductRecommendationsStep =
    currentStep?.stepType === "product-recommendations";
  const introVideo = activeFlow.introVideo || "/videos/Mattress_Shopping.mp4";

  // Generate dynamic answer summary text based on stored answers
  const generateAnswerSummary = useCallback(
    (summaryContent: AnswerSummaryContent): string => {
      const { introText, outroText, summaryMappings } = summaryContent;
      const summaryParts: string[] = [];

      // Iterate through the mappings in order
      Object.entries(summaryMappings).forEach(([stepId, valueMap]) => {
        const answer = storedAnswers.find((a) => a.stepId === stepId);
        if (answer && valueMap[answer.value]) {
          summaryParts.push(valueMap[answer.value]);
        }
      });

      if (summaryParts.length === 0) {
        return "Based on what you've shared, let me show you some recommendations.";
      }

      // Join parts with proper grammar
      let summaryText = "";
      if (summaryParts.length === 1) {
        summaryText = summaryParts[0];
      } else if (summaryParts.length === 2) {
        summaryText = `${summaryParts[0]} and ${summaryParts[1]}`;
      } else {
        const lastPart = summaryParts.pop();
        summaryText = `${summaryParts.join(", ")}, and ${lastPart}`;
      }

      return `${introText} ${summaryText} ${outroText}`;
    },
    [storedAnswers]
  );

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
      setCurrentEmotion("friendly");
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
        setShowBackdrop(true);
        setBackdropHasAnimated(true);
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

  // Handle answer-summary step - auto-speak and auto-advance
  useEffect(() => {
    if (
      isAnswerSummaryStep &&
      currentStep?.answerSummaryContent &&
      showQuestionBlock &&
      !isShowingResponse &&
      !hasSpokenSummary &&
      sessionState === AvatarSessionState.CONNECTED
    ) {
      const summaryText = generateAnswerSummary(currentStep.answerSummaryContent);
      const emotion = currentStep.answerSummaryContent.emotion || "friendly";

      // Mark summary as spoken so we don't repeat it
      setHasSpokenSummary(true);

      // Hide question block and backdrop, show the summary as avatar response
      setShowQuestionBlock(false);
      setShowBackdrop(false); setBackdropHasAnimated(false);
      setAvatarResponse(summaryText);
      setCurrentEmotion(emotion);
      setIsShowingResponse(true);
      setAvatarStartedTalking(false);

      // Make the avatar speak the summary
      speak(summaryText);
    }
  }, [
    isAnswerSummaryStep,
    currentStep,
    showQuestionBlock,
    isShowingResponse,
    hasSpokenSummary,
    sessionState,
    generateAnswerSummary,
    speak,
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
        // Check if this answer should terminate the flow
        if (option.terminateFlow) {
          // Use termination message if provided, otherwise use avatar response
          const termMessage =
            option.terminationMessage ||
            option.avatarResponse ||
            "Thank you for your time. Based on your answers, our program may not be the best fit for your needs.";
          const emotion = option.avatarEmotion || "friendly";

          setShowQuestionBlock(false);
          setShowBackdrop(false); setBackdropHasAnimated(false);
          setAvatarResponse(termMessage);
          setCurrentEmotion(emotion);
          setIsShowingResponse(true);
          setAvatarStartedTalking(false);
          setIsFlowTerminated(true);
          setTerminationMessage(termMessage);

          // Clear saved progress since flow is complete
          clearProgress();

          // Make the avatar speak the termination message
          if (sessionState === AvatarSessionState.CONNECTED) {
            speak(termMessage);
          }
        } else {
          // Normal flow - skip avatar response and go directly to next question
          // (Avatar responses are disabled but CMS fields remain for future use)
          // Keep backdrop visible during transition between questions
          setShowQuestionBlock(false);
          setSelectedAnswer(null);

          // Advance to next step after brief pause (backdrop stays visible)
          if (currentStepIndex < questionSteps.length - 1) {
            setCurrentStepIndex((prev) => prev + 1);
            setTimeout(() => {
              setShowQuestionBlock(true);
            }, 300);
          } else {
            // Flow complete - hide backdrop
            setShowBackdrop(false); setBackdropHasAnimated(false);
            console.log("Flow complete!");
          }
        }
      }, 1200); // Brief pause after selection before moving on
    },
    [
      sessionState,
      speak,
      currentStep,
      currentStepIndex,
      storedAnswers,
      saveProgress,
      flowParam,
      clearProgress,
      questionSteps.length,
    ]
  );

  const handleMattressSelectionComplete = useCallback(
    (selection: {
      size: MattressSize;
      feel: MattressFeel;
      finalPrice: number;
    }) => {
      setSelectedMattressSize(selection.size);
      setSelectedMattressFeel(selection.feel);

      // Store the mattress selection as an answer
      const newAnswer: StoredAnswer = {
        stepId: currentStep?.stepId || `step-${currentStepIndex}`,
        questionText: "Mattress Recommendation",
        value: `${selection.size}-${selection.feel}`,
        label: `Size: ${selection.size}, Feel: ${
          selection.feel
        }, Price: $${selection.finalPrice.toFixed(2)}`,
        timestamp: new Date(),
      };
      const updatedAnswers = [...storedAnswers, newAnswer];
      setStoredAnswers(updatedAnswers);

      // Auto-save progress
      saveProgress({
        flowId: flowParam,
        currentStepIndex: currentStepIndex + 1,
        answers: updatedAnswers,
      });

      // Get avatar response from the step content
      const response =
        currentStep?.mattressRecommendationContent?.avatarResponse ||
        "Excellent choice! That mattress is perfect for your sleep needs.";
      const emotion =
        currentStep?.mattressRecommendationContent?.avatarEmotion || "excited";

      // Show avatar response, hide backdrop
      setTimeout(() => {
        setShowQuestionBlock(false);
        setShowBackdrop(false); setBackdropHasAnimated(false);
        setAvatarResponse(response);
        setCurrentEmotion(emotion);
        setIsShowingResponse(true);
        setAvatarStartedTalking(false);

        if (sessionState === AvatarSessionState.CONNECTED) {
          speak(response);
        }
      }, 800);
    },
    [
      currentStep,
      currentStepIndex,
      storedAnswers,
      saveProgress,
      flowParam,
      sessionState,
      speak,
    ]
  );

  // Track product selection state (without advancing)
  const handleProductRecommendationComplete = useCallback(
    (selection: {
      mattressId: string;
      mattressName: string;
      size: MattressSize;
      feel: MattressFeel;
      finalPrice: number;
    }) => {
      // Just track the selection - don't advance yet
      setSelectedMattressSize(selection.size);
      setSelectedMattressFeel(selection.feel);
    },
    []
  );

  // Called when user clicks Continue button
  const handleProductRecommendationContinue = useCallback(
    (selection: {
      mattressId: string;
      mattressName: string;
      size: MattressSize;
      feel: MattressFeel;
      finalPrice: number;
    }) => {
      // Store the product selection as an answer
      const newAnswer: StoredAnswer = {
        stepId: currentStep?.stepId || `step-${currentStepIndex}`,
        questionText: "Product Recommendation",
        value: `${selection.mattressId}-${selection.size}-${selection.feel}`,
        label: `${selection.mattressName}, Size: ${selection.size}, Feel: ${selection.feel}, Price: $${selection.finalPrice.toFixed(2)}`,
        timestamp: new Date(),
      };
      const updatedAnswers = [...storedAnswers, newAnswer];
      setStoredAnswers(updatedAnswers);

      // Auto-save progress
      saveProgress({
        flowId: flowParam,
        currentStepIndex: currentStepIndex + 1,
        answers: updatedAnswers,
      });

      // Get avatar response from the step content
      const response =
        currentStep?.productRecommendationsContent?.avatarResponse ||
        "Excellent choice! That mattress is perfect for your sleep needs.";
      const emotion =
        currentStep?.productRecommendationsContent?.avatarEmotion || "excited";

      // Show avatar response, hide backdrop
      setTimeout(() => {
        setShowQuestionBlock(false);
        setShowBackdrop(false); setBackdropHasAnimated(false);
        setAvatarResponse(response);
        setCurrentEmotion(emotion);
        setIsShowingResponse(true);
        setAvatarStartedTalking(false);

        if (sessionState === AvatarSessionState.CONNECTED) {
          speak(response);
        }
      }, 800);
    },
    [
      currentStep,
      currentStepIndex,
      storedAnswers,
      saveProgress,
      flowParam,
      sessionState,
      speak,
    ]
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

      // Hide question block and backdrop, show avatar response
      setShowQuestionBlock(false);
      setShowBackdrop(false); setBackdropHasAnimated(false);
      setAvatarResponse(response);
      setIsShowingResponse(true);
      setAvatarStartedTalking(false); // Reset for next speech detection

      // Make the avatar speak the response
      if (sessionState === AvatarSessionState.CONNECTED) {
        speak(response);
      }
    },
    [
      currentStep,
      currentStepIndex,
      sessionState,
      speak,
      storedAnswers,
      saveProgress,
      flowParam,
    ]
  );

  // Show next question after avatar finishes speaking response
  useEffect(() => {
    if (isShowingResponse && avatarStartedTalking && !isAvatarTalking) {
      // Avatar finished speaking the response
      const timer = setTimeout(() => {
        // If flow was terminated, don't proceed to next question
        if (isFlowTerminated) {
          // Keep showing the termination message, don't clear it
          setIsShowingResponse(false);
          setSelectedAnswer(null);
          setAvatarStartedTalking(false);
          // Flow stays terminated - user can navigate away or contact support
          console.log("Flow terminated - user did not qualify");
          return;
        }

        setIsShowingResponse(false);
        setAvatarResponse(null);
        setSelectedAnswer(null);
        setAvatarStartedTalking(false);

        if (currentStepIndex < questionSteps.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
          // Small delay before showing next question (show backdrop first)
          setTimeout(() => {
            setShowBackdrop(true);
            setBackdropHasAnimated(true);
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
    isFlowTerminated,
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
              </p>
              {headerStep.headerContent.secondarySubheadline && (
                <p className={styles.subheadline}>
                  {headerStep.headerContent.secondarySubheadline}
                </p>
              )}
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

          {/* Only show avatar content once loaded (or in dev skip mode) */}
          {(isAvatarReady || skipIntro) && (
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

              {/* Persistent Backdrop - stays visible during question transitions */}
              {(showQuestionBlock || showBackdrop) && (
                <div className={styles.questionBlockWrapper}>
                  <div
                    className={`${styles.questionBlockBackdrop} ${(backdropHasAnimated || skipIntro) ? styles.backdropOnly : ''}`}
                  />

                  {/* Question Block Content */}
                  {showQuestionBlock &&
                    currentStep?.questionContent &&
                    !isMattressRecommendationStep &&
                    !isAnswerSummaryStep &&
                    !isProductRecommendationsStep && (
                      <div className={styles.questionBlockInner}>
                        <AnimatedQuestionBlock
                          questionContent={currentStep.questionContent}
                          questionKey={currentStep.stepId}
                          onAnswerSelect={handleAnswerSelect}
                          onTextSubmit={handleTextSubmit}
                          selectedValue={selectedAnswer?.value}
                        />
                      </div>
                    )}

                  {/* Mattress Recommendation Step */}
                  {showQuestionBlock &&
                    isMattressRecommendationStep &&
                    currentStep?.mattressRecommendationContent && (
                      <div className={styles.mattressRecommendationInner}>
                        <MattressRecommendation
                          content={currentStep.mattressRecommendationContent}
                          onSelectionComplete={handleMattressSelectionComplete}
                          selectedSize={selectedMattressSize}
                          selectedFeel={selectedMattressFeel}
                        />
                      </div>
                    )}

                  {/* Product Recommendations Step - 3 mattress options */}
                  {showQuestionBlock &&
                    isProductRecommendationsStep &&
                    currentStep?.productRecommendationsContent && (
                      <div className={styles.productRecommendationsInner}>
                        <ProductRecommendations
                          content={currentStep.productRecommendationsContent}
                          onSelectionComplete={handleProductRecommendationComplete}
                          onContinue={handleProductRecommendationContinue}
                        />
                      </div>
                    )}
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
        stepNames={questionSteps.map(
          (step) =>
            (step as FlowStep & { internalName?: string }).internalName ||
            step.stepId
        )}
        stepIds={questionSteps.map((step) => step.stepId)}
        currentEmotion={currentEmotion || undefined}
        sessionEmotion="friendly"
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
