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
  VideoAvatarProvider,
  VideoAvatar,
  useVideoAvatar,
  VideoState,
} from "@/components/VideoAvatar";
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
import { EmailCapture, EmailCaptureContent } from "@/components/EmailCapture";
import { SeeOptionsPrompt, SeeOptionsPromptContent } from "@/components/SeeOptionsPrompt";
import { StoreLocations, StoreLocationsContent } from "@/components/StoreLocations";
import { ZipCodeCapture, ZipCodeCaptureContent } from "@/components/ZipCodeCapture";
import { useProgressPersistence } from "@/hooks";
import { FLOWS } from "@/config";
import styles from "./page.module.css";

// Type for answer summary mappings
interface AnswerSummaryContent {
  introText: string;
  outroText: string;
  emotion: string;
  summaryMappings: Record<string, Record<string, string>>;
  empathyMessage?: string;
  empathyEmotion?: string;
  emailCTAMessage?: string;
  emailCTAEmotion?: string;
}

// Type for email capture content
interface EmailCaptureStepContent {
  promptText: string;
  placeholderText: string;
  submitButtonText: string;
  avatarResponseOnSubmit?: string;
  avatarEmotionOnSubmit?: string;
  skipOptionText?: string;
  avatarResponseOnSkip?: string;
  avatarEmotionOnSkip?: string;
}

// Type for see-options content
interface SeeOptionsStepContent {
  promptText: string;
  buttonText: string;
  avatarMessage?: string;
  avatarEmotion?: string;
}

// Type for zipcode-capture content
interface ZipCodeCaptureStepContent {
  headline: string;
  placeholderText: string;
  buttonText: string;
}

// Type for store-locations content
interface StoreLocationsStepContent {
  headerText: string;
  defaultPostalCode: string;
  ctaBookTitle: string;
  ctaBookDescription: string;
  ctaBookButtonText: string;
  ctaContactTitle: string;
  ctaContactDescription: string;
  ctaContactButtonText: string;
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
  emailCaptureContent?: EmailCaptureStepContent;
  seeOptionsContent?: SeeOptionsStepContent;
  zipcodeCaptureContent?: ZipCodeCaptureStepContent;
  storeLocationsContent?: StoreLocationsStepContent;
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
  const [userZipCode, setUserZipCode] = useState<string | null>(null);
  // Track the summary sequence phase: 'summary' -> 'empathy' -> 'emailCTA' -> 'done'
  const [summarySequencePhase, setSummarySequencePhase] = useState<
    'summary' | 'empathy' | 'emailCTA' | 'done'
  >('summary');

  // Video avatar hook
  const { videoState, isPlaying, play } = useVideoAvatar();

  // Track when video starts/stops playing (replaces avatarStartedTalking/isAvatarTalking)
  const isVideoPlaying = isPlaying;
  const isVideoReady = videoState !== VideoState.ERROR;

  // Dev mode: auto-play intro video when skipping intro
  useEffect(() => {
    if (skipIntro && videoState === VideoState.IDLE) {
      play('avatar-intro');
    }
  }, [skipIntro, videoState, play]);

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
      setIsLoadingAvatar(false); // No loading needed for MP4
      setIsMuted(false);

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
  }, [savedProgress]);

  // Handle starting fresh
  const handleStartFresh = useCallback(() => {
    clearProgress();
    setShowRecoveryModal(false);
    setHasHandledRecovery(true);
  }, [clearProgress]);

  // Track when video starts playing (to know when it's safe to check for stop)
  useEffect(() => {
    if (isVideoPlaying) {
      setAvatarStartedTalking(true);
    }
  }, [isVideoPlaying]);

  // Get flow data from CMS (uses activeFlow based on ?flow= param)
  const flowSteps = activeFlow.steps as FlowStep[];
  const headerStep = flowSteps.find((step) => step.stepType === "header");
  const questionSteps = flowSteps.filter(
    (step) =>
      step.stepType === "question" ||
      step.stepType === "mattress-recommendation" ||
      step.stepType === "answer-summary" ||
      step.stepType === "product-recommendations" ||
      step.stepType === "email-capture" ||
      step.stepType === "see-options" ||
      step.stepType === "zipcode-capture" ||
      step.stepType === "store-locations"
  );
  const currentStep = questionSteps[currentStepIndex];
  const isMattressRecommendationStep =
    currentStep?.stepType === "mattress-recommendation";
  const isAnswerSummaryStep = currentStep?.stepType === "answer-summary";
  const isProductRecommendationsStep =
    currentStep?.stepType === "product-recommendations";
  const isEmailCaptureStep = currentStep?.stepType === "email-capture";
  const isSeeOptionsStep = currentStep?.stepType === "see-options";
  const isZipCodeCaptureStep = currentStep?.stepType === "zipcode-capture";
  const isStoreLocationsStep = currentStep?.stepType === "store-locations";
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

  // Video is ready when not in error state
  const isAvatarReady = isVideoReady;

  const handleBegin = useCallback(async () => {
    setIsTransitioning(true);
    setIsLoadingAvatar(false); // No loading needed for MP4
    setIsMuted(false); // Unmute when user clicks "Let's Begin"

    setTimeout(() => {
      setCurrentView("question");
      setIsTransitioning(false);
      // Play intro video after transition
      play('avatar-intro');
    }, 500); // Match CSS transition duration
  }, [play]);

  const handleVolumeToggle = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // Mark intro as spoken when video starts playing
  useEffect(() => {
    if (
      currentView === "question" &&
      isVideoPlaying &&
      !hasSpokenIntro
    ) {
      setHasSpokenIntro(true);
      setCurrentEmotion("friendly");
    }
  }, [currentView, isVideoPlaying, hasSpokenIntro]);

  // Show question block after Ashley finishes speaking intro
  // Only trigger when video has started AND stopped playing
  useEffect(() => {
    if (
      currentView === "question" &&
      hasSpokenIntro &&
      avatarStartedTalking &&
      !isVideoPlaying &&
      videoState === VideoState.ENDED &&
      !hasShownIntro
    ) {
      // Pause after video stops before showing questions
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
    isVideoPlaying,
    videoState,
    hasShownIntro,
  ]);

  // Handle answer-summary step - show summary text (no video for dynamic content)
  // TODO: Add summary video when available
  useEffect(() => {
    if (
      isAnswerSummaryStep &&
      currentStep?.answerSummaryContent &&
      showQuestionBlock &&
      !isShowingResponse &&
      !hasSpokenSummary &&
      summarySequencePhase === 'summary'
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
      setAvatarStartedTalking(true); // Simulate video started

      // Auto-advance after showing text (since no video to wait for)
      setTimeout(() => {
        setAvatarStartedTalking(false);
      }, 3000); // Show summary for 3 seconds
    }
  }, [
    isAnswerSummaryStep,
    currentStep,
    showQuestionBlock,
    isShowingResponse,
    hasSpokenSummary,
    summarySequencePhase,
    generateAnswerSummary,
  ]);

  // Handle progression through summary sequence (empathy → emailCTA → email capture)
  // With MP4 videos, we use text display with timeouts since dynamic speech is pre-recorded
  useEffect(() => {
    if (
      isAnswerSummaryStep &&
      isShowingResponse &&
      avatarStartedTalking &&
      !isVideoPlaying &&
      currentStep?.answerSummaryContent
    ) {
      const content = currentStep.answerSummaryContent;

      if (summarySequencePhase === 'summary' && content.empathyMessage) {
        // Summary finished, show empathy message (text only, no video)
        const timer = setTimeout(() => {
          setSummarySequencePhase('empathy');
          setAvatarResponse(content.empathyMessage!);
          setCurrentEmotion(content.empathyEmotion || 'soothing');
          setAvatarStartedTalking(true); // Simulate start
          // Auto-advance after showing text
          setTimeout(() => setAvatarStartedTalking(false), 3000);
        }, 800);
        return () => clearTimeout(timer);
      } else if (summarySequencePhase === 'empathy' && content.emailCTAMessage) {
        // Empathy finished, show email CTA message (text only, no video)
        const timer = setTimeout(() => {
          setSummarySequencePhase('emailCTA');
          setAvatarResponse(content.emailCTAMessage!);
          setCurrentEmotion(content.emailCTAEmotion || 'friendly');
          setAvatarStartedTalking(true); // Simulate start
          // Auto-advance after showing text
          setTimeout(() => setAvatarStartedTalking(false), 3000);
        }, 800);
        return () => clearTimeout(timer);
      } else if (summarySequencePhase === 'emailCTA' ||
                 (summarySequencePhase === 'summary' && !content.empathyMessage) ||
                 (summarySequencePhase === 'empathy' && !content.emailCTAMessage)) {
        // Finished email CTA (or no more messages), advance to email capture step
        const timer = setTimeout(() => {
          setSummarySequencePhase('done');
          setIsShowingResponse(false);
          setAvatarResponse(null);
          setAvatarStartedTalking(false);

          // Advance to next step (email capture)
          if (currentStepIndex < questionSteps.length - 1) {
            setCurrentStepIndex((prev) => prev + 1);
            setTimeout(() => {
              setShowBackdrop(true);
              setBackdropHasAnimated(true);
              setShowQuestionBlock(true);
            }, 300);
          }
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [
    isAnswerSummaryStep,
    isShowingResponse,
    avatarStartedTalking,
    isVideoPlaying,
    summarySequencePhase,
    currentStep,
    currentStepIndex,
    questionSteps.length,
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
          setAvatarStartedTalking(true); // Simulate start for text display
          setIsFlowTerminated(true);
          setTerminationMessage(termMessage);

          // Clear saved progress since flow is complete
          clearProgress();

          // Auto-advance after showing termination text (no video for dynamic content)
          setTimeout(() => setAvatarStartedTalking(false), 4000);
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

      // Show avatar response (text only), hide backdrop
      setTimeout(() => {
        setShowQuestionBlock(false);
        setShowBackdrop(false); setBackdropHasAnimated(false);
        setAvatarResponse(response);
        setCurrentEmotion(emotion);
        setIsShowingResponse(true);
        setAvatarStartedTalking(true); // Simulate start for text display

        // Auto-advance after showing text (no video for dynamic content)
        setTimeout(() => setAvatarStartedTalking(false), 3000);
      }, 800);
    },
    [
      currentStep,
      currentStepIndex,
      storedAnswers,
      saveProgress,
      flowParam,
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

      // Show avatar response (text only), hide backdrop
      setTimeout(() => {
        setShowQuestionBlock(false);
        setShowBackdrop(false); setBackdropHasAnimated(false);
        setAvatarResponse(response);
        setCurrentEmotion(emotion);
        setIsShowingResponse(true);
        setAvatarStartedTalking(true); // Simulate start for text display

        // Auto-advance after showing text (no video for dynamic content)
        setTimeout(() => setAvatarStartedTalking(false), 3000);
      }, 800);
    },
    [
      currentStep,
      currentStepIndex,
      storedAnswers,
      saveProgress,
      flowParam,
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

      // Hide question block and backdrop, show avatar response (text only)
      setShowQuestionBlock(false);
      setShowBackdrop(false); setBackdropHasAnimated(false);
      setAvatarResponse(response);
      setIsShowingResponse(true);
      setAvatarStartedTalking(true); // Simulate start for text display

      // Auto-advance after showing text (no video for dynamic content)
      setTimeout(() => setAvatarStartedTalking(false), 3000);
    },
    [
      currentStep,
      currentStepIndex,
      storedAnswers,
      saveProgress,
      flowParam,
    ]
  );

  // Handle email submission
  const handleEmailSubmit = useCallback(
    (email: string) => {
      console.log("Email submitted:", email);

      // Store the email as an answer
      const newAnswer: StoredAnswer = {
        stepId: currentStep?.stepId || `step-${currentStepIndex}`,
        questionText: "Email Capture",
        value: email,
        label: email,
        timestamp: new Date(),
      };
      const updatedAnswers = [...storedAnswers, newAnswer];
      setStoredAnswers(updatedAnswers);

      // Save progress (don't clear yet - we're continuing to see-options)
      saveProgress({
        flowId: flowParam,
        currentStepIndex: currentStepIndex + 1,
        answers: updatedAnswers,
      });

      // Hide email capture and advance directly to see-options step
      setShowQuestionBlock(false);

      if (currentStepIndex < questionSteps.length - 1) {
        setCurrentStepIndex((prev) => prev + 1);
        setTimeout(() => {
          setShowQuestionBlock(true);
        }, 300);
      }
    },
    [
      currentStep,
      currentStepIndex,
      storedAnswers,
      saveProgress,
      flowParam,
      questionSteps.length,
    ]
  );

  // Handle email skip
  const handleEmailSkip = useCallback(() => {
    console.log("Email skipped");

    // Hide email capture and advance directly to see-options step
    setShowQuestionBlock(false);

    if (currentStepIndex < questionSteps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      setTimeout(() => {
        setShowQuestionBlock(true);
      }, 300);
    }
  }, [currentStepIndex, questionSteps.length]);

  // Handle see options button click
  const handleSeeOptionsClick = useCallback(() => {
    console.log("See options clicked");

    // Simply advance to the next step (product recommendations)
    setShowQuestionBlock(false);

    if (currentStepIndex < questionSteps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      setTimeout(() => {
        setShowQuestionBlock(true);
      }, 300);
    }
  }, [currentStepIndex, questionSteps.length]);

  // Handle zipcode submission
  const handleZipCodeSubmit = useCallback(
    (zipCode: string) => {
      console.log("Zip code submitted:", zipCode);

      // Store the zipcode for the store locations step
      setUserZipCode(zipCode);

      // Store as an answer
      const newAnswer: StoredAnswer = {
        stepId: currentStep?.stepId || `step-${currentStepIndex}`,
        questionText: "Zip Code",
        value: zipCode,
        label: zipCode,
        timestamp: new Date(),
      };
      const updatedAnswers = [...storedAnswers, newAnswer];
      setStoredAnswers(updatedAnswers);

      // Save progress
      saveProgress({
        flowId: flowParam,
        currentStepIndex: currentStepIndex + 1,
        answers: updatedAnswers,
      });

      // Advance to next step (store locations)
      setShowQuestionBlock(false);

      if (currentStepIndex < questionSteps.length - 1) {
        setCurrentStepIndex((prev) => prev + 1);
        setTimeout(() => {
          setShowQuestionBlock(true);
        }, 300);
      }
    },
    [
      currentStep,
      currentStepIndex,
      storedAnswers,
      saveProgress,
      flowParam,
      questionSteps.length,
    ]
  );

  // Show next question after avatar response finishes
  // (Skip if in answer-summary step - that has its own handler for the 3-message sequence)
  useEffect(() => {
    if (isShowingResponse && avatarStartedTalking && !isVideoPlaying && !isAnswerSummaryStep) {
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
    isVideoPlaying,
    isAnswerSummaryStep,
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
                {/* Video Avatar Wrapper */}
                <div className={styles.heygenWrapper}>
                  <VideoAvatar
                    className={styles.heygenAvatar}
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
                    !isProductRecommendationsStep &&
                    !isEmailCaptureStep && (
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

                  {/* Email Capture Step */}
                  {showQuestionBlock &&
                    isEmailCaptureStep &&
                    currentStep?.emailCaptureContent && (
                      <div className={styles.questionBlockInner}>
                        <EmailCapture
                          content={currentStep.emailCaptureContent as EmailCaptureContent}
                          onSubmit={handleEmailSubmit}
                          onSkip={handleEmailSkip}
                        />
                      </div>
                    )}

                  {/* See Options Prompt Step */}
                  {showQuestionBlock &&
                    isSeeOptionsStep &&
                    currentStep?.seeOptionsContent && (
                      <div className={styles.questionBlockInner}>
                        <SeeOptionsPrompt
                          content={currentStep.seeOptionsContent as SeeOptionsPromptContent}
                          onContinue={handleSeeOptionsClick}
                        />
                      </div>
                    )}

                  {/* Zip Code Capture Step */}
                  {showQuestionBlock &&
                    isZipCodeCaptureStep &&
                    currentStep?.zipcodeCaptureContent && (
                      <div className={styles.questionBlockInner}>
                        <ZipCodeCapture
                          content={currentStep.zipcodeCaptureContent as ZipCodeCaptureContent}
                          onSubmit={handleZipCodeSubmit}
                        />
                      </div>
                    )}

                  {/* Store Locations Step */}
                  {showQuestionBlock &&
                    isStoreLocationsStep &&
                    currentStep?.storeLocationsContent && (
                      <div className={styles.storeLocationsInner}>
                        <StoreLocations
                          content={currentStep.storeLocationsContent as StoreLocationsContent}
                          postalCode={userZipCode || currentStep.storeLocationsContent.defaultPostalCode}
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

// Wrap with Video Avatar Provider and Suspense (required for useSearchParams)
export default function Home() {
  return (
    <Suspense fallback={null}>
      <VideoAvatarProvider>
        <HomeContent />
      </VideoAvatarProvider>
    </Suspense>
  );
}
