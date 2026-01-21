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

// Type for flow steps - using template-based structure
// Each step has _template to identify its type, and fields are at the top level
interface FlowStep {
  _template: string;
  stepId: string;
  internalName?: string;
  // Video step fields
  video?: string;
  script?: string;
  // Question step fields
  questionText?: string;
  inputType?: string;
  helperText?: string;
  isRequired?: boolean;
  answerOptions?: CMSAnswerOption[];
  // Email capture fields
  promptText?: string;
  placeholderText?: string;
  submitButtonText?: string;
  avatarResponseOnSubmit?: string;
  // See options fields
  buttonText?: string;
  avatarMessage?: string;
  avatarEmotion?: string;
  // Product recommendations fields
  headline?: string;
  avatarResponse?: string;
  // Zipcode capture fields (uses headline, placeholderText, buttonText)
  // Store locations fields
  headerText?: string;
  defaultPostalCode?: string;
  ctaBookTitle?: string;
  ctaBookDescription?: string;
  ctaBookButtonText?: string;
  ctaContactTitle?: string;
  ctaContactDescription?: string;
  ctaContactButtonText?: string;
  // Mattress recommendation (if still used)
  mattressRecommendationContent?: MattressRecommendationContent;
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

  // Track URL step changes for DevPanel navigation
  const [urlStepParam, setUrlStepParam] = useState(stepParam);

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

  // Video avatar hook
  const { videoState, isPlaying, isNearingEnd, play } = useVideoAvatar();

  // Track when video starts/stops playing (replaces avatarStartedTalking/isAvatarTalking)
  const isVideoPlaying = isPlaying;
  const isVideoReady = videoState !== VideoState.ERROR;

  // Dev mode: auto-play intro video when skipping intro
  useEffect(() => {
    if (skipIntro && videoState === VideoState.IDLE) {
      play('avatar-intro');
    }
  }, [skipIntro, videoState, play]);

  // Sync state when URL step param changes (for DevPanel navigation)
  useEffect(() => {
    if (stepParam !== urlStepParam) {
      setUrlStepParam(stepParam);

      if (stepParam === null) {
        // Going to intro
        setCurrentView("intro");
        setShowQuestionBlock(false);
        setShowBackdrop(false);
        setBackdropHasAnimated(false);
        setHasShownIntro(false);
        setHasSpokenIntro(false);
        setAvatarStartedTalking(false);
        setIsShowingResponse(false);
        setAvatarResponse(null);
        setHasSpokenSummary(false);
        setCurrentStepIndex(0);
      } else {
        // Going to a specific step
        const newStepIndex = Math.max(0, parseInt(stepParam, 10) - 1);
        setCurrentView("question");
        setCurrentStepIndex(newStepIndex);
        setShowQuestionBlock(true);
        setShowBackdrop(true);
        setBackdropHasAnimated(true);
        setHasShownIntro(true);
        setHasSpokenIntro(true);
        setIsShowingResponse(false);
        setAvatarResponse(null);
        setHasSpokenSummary(false);
        setAvatarStartedTalking(false);
      }
    }
  }, [stepParam, urlStepParam]);

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
  const introScreen = activeFlow.introScreen as {
    avatarImage?: string;
    backgroundVideo?: string;
    headline: string;
    subheadline: string;
    secondarySubheadline?: string;
    primaryButtonText: string;
    audioNotice?: string;
  } | undefined;
  // All steps are now valid flow steps (using templates)
  const questionSteps = flowSteps;
  const currentStep = questionSteps[currentStepIndex];
  const isMattressRecommendationStep =
    currentStep?._template === "mattressRecommendationStep";
  const isVideoStep = currentStep?._template === "videoStep";
  const isProductRecommendationsStep =
    currentStep?._template === "productRecommendationsStep";
  const isEmailCaptureStep = currentStep?._template === "emailCaptureStep";
  const isSeeOptionsStep = currentStep?._template === "seeOptionsStep";
  const isZipCodeCaptureStep = currentStep?._template === "zipcodeCaptureStep";
  const isStoreLocationsStep = currentStep?._template === "storeLocationsStep";
  const isQuestionStep = currentStep?._template === "questionStep";
  // Get intro video from intro screen config (used as background on intro screen)
  const introVideo = introScreen?.backgroundVideo || "/videos/Mattress_Shopping.mp4";

  // Get intro message from the first video step's script (shown in speech bubble during intro)
  const firstVideoStep = questionSteps.find((step) => step._template === "videoStep");
  const introMessage = firstVideoStep?.script || "";

  // Video is ready when not in error state
  const isAvatarReady = isVideoReady;

  const handleBegin = useCallback(async () => {
    setIsTransitioning(true);
    setIsMuted(false); // Unmute when user clicks "Let's Begin"

    setTimeout(() => {
      setCurrentView("question");
      setIsTransitioning(false);
      // Show question block immediately - video step will handle playing
      setShowBackdrop(true);
      setBackdropHasAnimated(true);
      setShowQuestionBlock(true);
      setHasShownIntro(true);
      setHasSpokenIntro(true);
    }, 500); // Match CSS transition duration
  }, []);

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

  // Show question block when video is nearing end (1 second before)
  // This creates a smooth overlap transition
  useEffect(() => {
    if (
      currentView === "question" &&
      hasSpokenIntro &&
      avatarStartedTalking &&
      isNearingEnd &&
      !hasShownIntro
    ) {
      // Start showing overlay ~1 second before video ends
      setShowBackdrop(true);
      setBackdropHasAnimated(true);
      setShowQuestionBlock(true);
      setHasShownIntro(true);
    }
  }, [
    currentView,
    hasSpokenIntro,
    avatarStartedTalking,
    isNearingEnd,
    hasShownIntro,
  ]);

  // Handle video step - play video if videoId is specified
  useEffect(() => {
    if (
      isVideoStep &&
      currentStep &&
      showQuestionBlock &&
      !isShowingResponse &&
      !hasSpokenSummary
    ) {
      const scriptText = currentStep.script || "";
      const videoPath = currentStep.video;

      // Mark summary as spoken so we don't repeat it
      setHasSpokenSummary(true);

      // Hide question block and backdrop, show the script in speech bubble
      setShowQuestionBlock(false);
      setShowBackdrop(false); setBackdropHasAnimated(false);
      setAvatarResponse(scriptText);
      setIsShowingResponse(true);
      setAvatarStartedTalking(true);

      // If video is specified, play it (accepts direct path or registry ID)
      if (videoPath) {
        play(videoPath);
      } else {
        // No video - auto-advance after showing text
        setTimeout(() => {
          setAvatarStartedTalking(false);
        }, 3000); // Show summary for 3 seconds
      }
    }
  }, [
    isVideoStep,
    currentStep,
    showQuestionBlock,
    isShowingResponse,
    hasSpokenSummary,
    play,
  ]);

  // Handle video step completion - advance to next step when video ends
  useEffect(() => {
    if (
      isVideoStep &&
      isShowingResponse &&
      avatarStartedTalking &&
      !isVideoPlaying &&
      hasSpokenSummary
    ) {
      // Video finished - wait a moment before advancing to let user finish reading
      // Keep speech bubble visible for 2 seconds after video ends
      const timer = setTimeout(() => {
        setIsShowingResponse(false);
        setAvatarResponse(null);
        setAvatarStartedTalking(false);
        setHasSpokenSummary(false); // Reset for next video step

        // Advance to next step
        if (currentStepIndex < questionSteps.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
          setTimeout(() => {
            setShowBackdrop(true);
            setBackdropHasAnimated(true);
            setShowQuestionBlock(true);
          }, 300);
        }
      }, 2000); // 2 second delay after video ends before hiding speech bubble
      return () => clearTimeout(timer);
    }
  }, [
    isVideoStep,
    isShowingResponse,
    avatarStartedTalking,
    isVideoPlaying,
    hasSpokenSummary,
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
        questionText: currentStep?.questionText || "",
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

      // Get avatar response from the step content (mattress recommendation)
      const response =
        currentStep?.avatarResponse ||
        "Excellent choice! That mattress is perfect for your sleep needs.";
      const emotion =
        currentStep?.avatarEmotion || "excited";

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
        currentStep?.avatarResponse ||
        "Excellent choice! That mattress is perfect for your sleep needs.";
      const emotion =
        currentStep?.avatarEmotion || "excited";

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
        questionText: currentStep?.questionText || "",
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

      // Get the avatar response (text input doesn't have per-option responses)
      const response = "Thank you! Let me continue with the next question.";
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
    async (email: string) => {
      console.log("Email submitted:", email);

      // TODO: POST to CRM (endpoint TBD)
      // Example structure for when CRM is ready:
      // try {
      //   const response = await fetch('/api/crm/subscribe', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify({
      //       email,
      //       source: 'sleep-report',
      //       flowId: flowParam,
      //       answers: storedAnswers,
      //     }),
      //   });
      //   if (!response.ok) {
      //     console.error('CRM submission failed:', response.status);
      //   }
      // } catch (error) {
      //   console.error('CRM submission error:', error);
      // }

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

    // Store "skipped" as the answer for this step
    const newAnswer: StoredAnswer = {
      stepId: currentStep?.stepId || `step-${currentStepIndex}`,
      questionText: "Email Capture",
      value: "skipped",
      label: "Skipped",
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

    // Hide email capture and advance directly to see-options step
    setShowQuestionBlock(false);

    if (currentStepIndex < questionSteps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      setTimeout(() => {
        setShowQuestionBlock(true);
      }, 300);
    }
  }, [
    currentStep,
    currentStepIndex,
    storedAnswers,
    saveProgress,
    flowParam,
    questionSteps.length,
  ]);

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
  // (Skip if in video step - that has its own handler)
  useEffect(() => {
    if (isShowingResponse && avatarStartedTalking && !isVideoPlaying && !isVideoStep) {
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
        setHasSpokenSummary(false); // Reset for next video step

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
    isVideoStep,
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
      {currentView === "intro" && introScreen && (
        <div
          className={`${styles.contentWrapper} ${
            isTransitioning ? styles.fadeOut : styles.fadeIn
          }`}
        >
          <div className={styles.contentInner}>
            {/* Avatar */}
            <div className={styles.avatarContainer}>
              <Image
                src={introScreen.avatarImage || "/images/avatar-2x.png"}
                alt={`${activeFlow.globalVariables.avatarName || "Ashley"}, your BetterSleep AI Coach`}
                width={220}
                height={220}
                className={styles.avatar}
                priority
              />
            </div>

            {/* Text Content */}
            <div className={styles.textContent}>
              <h1 className={styles.titlePage}>
                {introScreen.headline}
              </h1>
              <p className={styles.subheadline}>
                {introScreen.subheadline}
              </p>
              {introScreen.secondarySubheadline && (
                <p className={styles.subheadline}>
                  {introScreen.secondarySubheadline}
                </p>
              )}
            </div>

            {/* CTA Section */}
            <div className={styles.ctaSection}>
              {introScreen.audioNotice && (
                <p className={styles.audioNotice}>
                  {introScreen.audioNotice}
                </p>
              )}
              <Button variant="primary" size="large" onClick={handleBegin}>
                {introScreen.primaryButtonText}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Question View */}
      {currentView === "question" && (isAvatarReady || skipIntro) && (
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
                  stayVisible={isVideoPlaying}
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
                isQuestionStep &&
                currentStep?.questionText && (
                  <div className={styles.questionBlockInner}>
                    <AnimatedQuestionBlock
                      questionContent={{
                        questionText: currentStep.questionText,
                        inputType: currentStep.inputType,
                        helperText: currentStep.helperText,
                        isRequired: currentStep.isRequired,
                        answerOptions: currentStep.answerOptions,
                      } as CMSQuestionContent}
                      questionKey={currentStep.stepId}
                      onAnswerSelect={handleAnswerSelect}
                      onTextSubmit={handleTextSubmit}
                      selectedValue={selectedAnswer?.value}
                    />
                  </div>
                )}

              {/* Mattress Recommendation Step */}
              {/* Note: MattressRecommendation requires complex nested content (sizes, feels arrays) */}
              {/* This step type needs additional CMS schema work to fully support */}
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
              {/* Note: ProductRecommendations requires complex nested content (mattressOptions, sizes, feels arrays) */}
              {/* This step type needs additional CMS schema work to fully support */}
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
                isEmailCaptureStep && (
                  <div className={styles.questionBlockInner}>
                    <EmailCapture
                      content={{
                        promptText: currentStep?.promptText,
                        placeholderText: currentStep?.placeholderText,
                        submitButtonText: currentStep?.submitButtonText,
                        avatarResponseOnSubmit: currentStep?.avatarResponseOnSubmit,
                      } as EmailCaptureContent}
                      onSubmit={handleEmailSubmit}
                      onSkip={handleEmailSkip}
                    />
                  </div>
                )}

              {/* See Options Prompt Step */}
              {showQuestionBlock &&
                isSeeOptionsStep && (
                  <div className={styles.questionBlockInner}>
                    <SeeOptionsPrompt
                      content={{
                        promptText: currentStep?.promptText,
                        buttonText: currentStep?.buttonText,
                        avatarMessage: currentStep?.avatarMessage,
                        avatarEmotion: currentStep?.avatarEmotion,
                      } as SeeOptionsPromptContent}
                      onContinue={handleSeeOptionsClick}
                    />
                  </div>
                )}

              {/* Zip Code Capture Step */}
              {showQuestionBlock &&
                isZipCodeCaptureStep && (
                  <div className={styles.questionBlockInner}>
                    <ZipCodeCapture
                      content={{
                        headline: currentStep?.headline,
                        placeholderText: currentStep?.placeholderText,
                        buttonText: currentStep?.buttonText,
                      } as ZipCodeCaptureContent}
                      onSubmit={handleZipCodeSubmit}
                    />
                  </div>
                )}

              {/* Store Locations Step */}
              {showQuestionBlock &&
                isStoreLocationsStep && (
                  <div className={styles.storeLocationsInner}>
                    <StoreLocations
                      content={{
                        headerText: currentStep?.headerText,
                        defaultPostalCode: currentStep?.defaultPostalCode,
                        ctaBookTitle: currentStep?.ctaBookTitle,
                        ctaBookDescription: currentStep?.ctaBookDescription,
                        ctaBookButtonText: currentStep?.ctaBookButtonText,
                        ctaContactTitle: currentStep?.ctaContactTitle,
                        ctaContactDescription: currentStep?.ctaContactDescription,
                        ctaContactButtonText: currentStep?.ctaContactButtonText,
                      } as StoreLocationsContent}
                      postalCode={userZipCode || currentStep?.defaultPostalCode || ""}
                    />
                  </div>
                )}
            </div>
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
