"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import { SpeechBubbleSequence, SubtitleCue } from "@/components/SpeechBubbleSequence";
import { parseVtt, getVttPathFromVideo } from "@/lib/subtitles";
import { geocodeWithFallback, Coordinates } from "@/lib/geocoding";
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
import { ActionPrompt, ActionPromptContent } from "@/components/ActionPrompt";
import { StoreLocations, StoreLocationsContent } from "@/components/StoreLocations";
import { ZipCodeCapture, ZipCodeCaptureContent } from "@/components/ZipCodeCapture";
import { useProgressPersistence } from "@/hooks";
import { FLOWS } from "@/config";
import styles from "./page.module.css";

// Default product recommendations content (fallback when CMS content not provided)
const DEFAULT_PRODUCT_RECOMMENDATIONS: ProductRecommendationsContent = {
  headline: "Your Perfect Mattress Matches",
  introParagraph: "Based on your sleep profile, I've found three mattresses that will help you wake up without back pain.",
  mattressOptions: [
    {
      id: "serenity-hybrid",
      productName: "Serenity Hybrid",
      productDescription: "Our most advanced sleep technology with cooling gel memory foam and individually wrapped coils for ultimate support.",
      basePrice: 1299,
      productImage: "/images/mattress-tempurpedic.jpg",
      badge: "Best Value",
      profile: '12"',
      coolingLevel: 4,
      pressureReliefLevel: 5,
      features: [
        "Cooling gel-infused memory foam",
        "Individually wrapped coils",
        "Reinforced lumbar support zone",
        "CertiPUR-US certified foams",
      ],
    },
    {
      id: "comfort-plus",
      productName: "ComfortPlus Elite",
      productDescription: "Premium comfort with enhanced lumbar support, perfect for back and side sleepers.",
      basePrice: 1699,
      productImage: "/images/mattress-tempurpedic.jpg",
      badge: "Most Popular",
      profile: '13"',
      coolingLevel: 5,
      pressureReliefLevel: 4,
      features: [
        "Phase-change cooling cover",
        "Zoned support system",
        "High-density base foam",
        "365-night sleep trial",
      ],
    },
    {
      id: "dream-supreme",
      productName: "Dream Supreme",
      productDescription: "Luxury hotel-quality sleep with advanced pressure relief and motion isolation.",
      basePrice: 2199,
      productImage: "/images/mattress-tempurpedic.jpg",
      badge: "Premium Choice",
      profile: '14"',
      coolingLevel: 5,
      pressureReliefLevel: 5,
      features: [
        "Organic cotton cover",
        "Natural latex comfort layer",
        "Advanced motion isolation",
        "Lifetime warranty",
      ],
    },
  ],
  sizes: [
    { value: "twin", label: "Twin", priceModifier: -300 },
    { value: "twin-xl", label: "Twin XL", priceModifier: -200 },
    { value: "full", label: "Full", priceModifier: -100 },
    { value: "queen", label: "Queen", priceModifier: 0 },
    { value: "king", label: "King", priceModifier: 200 },
  ],
  feels: [
    { value: "soft", label: "Soft" },
    { value: "medium", label: "Medium" },
    { value: "firm", label: "Firm" },
  ],
  avatarResponse: "Great choice! This mattress is perfect for your sleep needs.",
};

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
  avatarVideoSrc?: string;
  avatarText?: string;
  // Mattress recommendation (if still used)
  mattressRecommendationContent?: MattressRecommendationContent;
  productRecommendationsContent?: ProductRecommendationsContent;
}

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

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
  const [userCoordinates, setUserCoordinates] = useState<Coordinates | null>(null);
  const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);
  const [videoSubtitleCues, setVideoSubtitleCues] = useState<SubtitleCue[]>([]);

  // Video avatar hook
  const { videoState, isPlaying, isNearingEnd, play, preload, currentTime, currentVideoId } = useVideoAvatar();

  // Debug: Log video state changes
  useEffect(() => {
    console.log('[VideoStateChange] videoState:', videoState);
  }, [videoState]);

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

  // Debug: Log step and render state
  useEffect(() => {
    console.log('[StepDebug]', {
      currentStepIndex,
      stepId: currentStep?.stepId,
      template: currentStep?._template,
      showQuestionBlock,
      showBackdrop,
      isZipCodeCaptureStep,
      isVideoStep,
      videoState,
      isShowingResponse,
      avatarStartedTalking,
      hasSpokenSummary,
    });
  }, [currentStepIndex, currentStep, showQuestionBlock, showBackdrop, isZipCodeCaptureStep, isVideoStep, videoState, isShowingResponse, avatarStartedTalking, hasSpokenSummary]);

  // Reset hasSpokenSummary when step changes to ensure video steps can play
  useEffect(() => {
    console.log('[StepChange] Resetting hasSpokenSummary for step:', currentStepIndex);
    setHasSpokenSummary(false);
  }, [currentStepIndex]);

  // Get intro video from intro screen config (used as background on intro screen)
  const introVideo = introScreen?.backgroundVideo || "/videos/Mattress_Shopping.mp4";

  // Get intro message from the first video step's script (shown in speech bubble during intro)
  const firstVideoStep = questionSteps.find((step) => step._template === "videoStep");
  const introMessage = firstVideoStep?.script || "";

  // Preload video steps while user is on intro screen
  useEffect(() => {
    if (currentView === 'intro') {
      for (const step of flowSteps) {
        if (step._template === 'videoStep' && step.video) {
          preload(step.video);
        }
      }
    }
  }, [currentView, flowSteps, preload]);

  // Video is ready when not in error state
  const isAvatarReady = isVideoReady;

  // Helper function to log flow data in clean JSON format
  const logFlowData = useCallback((answers: StoredAnswer[], context?: string) => {
    const flowData = {
      flowId: flowParam,
      timestamp: new Date().toISOString(),
      sessionData: {
        currentStep: currentStepIndex + 1,
        totalSteps: questionSteps.length,
        email: answers.find(a => a.stepId === 'email-capture')?.value || null,
        zipCode: userZipCode,
        mattressSelection: selectedMattressSize && selectedMattressFeel ? {
          size: selectedMattressSize,
          feel: selectedMattressFeel,
        } : null,
      },
      answers: answers.map(({ stepId, questionText, value, label, timestamp }) => ({
        stepId,
        question: questionText,
        answer: {
          value,
          label,
        },
        answeredAt: timestamp instanceof Date ? timestamp.toISOString() : timestamp,
      })),
    };

    console.log(`\n📋 Flow Data${context ? ` (${context})` : ''}:`);
    console.log(JSON.stringify(flowData, null, 2));

    return flowData;
  }, [flowParam, currentStepIndex, questionSteps.length, userZipCode, selectedMattressSize, selectedMattressFeel]);

  const handleBegin = useCallback(async () => {
    setIsTransitioning(true);

    // Check if first step is a video step - if so, start playback immediately
    // This is CRITICAL for mobile: video.play() must be called synchronously
    // within the user gesture (click) handler to satisfy autoplay policies
    const firstStep = questionSteps[0];
    if (firstStep?._template === "videoStep" && firstStep.video) {
      // Start video immediately within user gesture context
      // Keep muted initially for mobile autoplay compliance, unmute after play starts
      play(firstStep.video);

      // Unmute after a short delay to allow playback to start
      // This works because mobile browsers allow unmuting after user-initiated play
      setTimeout(() => {
        setIsMuted(false);
      }, 100);
    } else {
      // No video step - unmute immediately
      setIsMuted(false);
    }

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
  }, [questionSteps, play]);

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
    // Debug logging
    console.log('[VideoStep] Check:', {
      isVideoStep,
      hasCurrentStep: !!currentStep,
      showQuestionBlock,
      isShowingResponse,
      hasSpokenSummary,
      stepId: currentStep?.stepId,
      videoPath: currentStep?.video,
    });

    if (
      isVideoStep &&
      currentStep &&
      showQuestionBlock &&
      !isShowingResponse &&
      !hasSpokenSummary
    ) {
      console.log('[VideoStep] Starting video step:', currentStep.stepId);
      const scriptText = currentStep.script || "";
      const videoPath = currentStep.video;

      // Clear previous subtitle cues before loading new ones
      setVideoSubtitleCues([]);

      // Mark summary as spoken so we don't repeat it
      setHasSpokenSummary(true);

      // Hide question block and backdrop, show the script in speech bubble
      setShowQuestionBlock(false);
      setShowBackdrop(false); setBackdropHasAnimated(false);
      setAvatarResponse(scriptText);
      setIsShowingResponse(true);
      setAvatarStartedTalking(true);

      // If video is specified, play it and fetch VTT subtitles
      if (videoPath) {
        console.log('[VideoStep] Playing video:', videoPath);

        // Fetch VTT file for subtitle timing
        const vttPath = getVttPathFromVideo(videoPath);
        console.log('[VideoStep] Fetching VTT from:', vttPath);
        fetch(vttPath)
          .then(res => {
            console.log('[VideoStep] VTT fetch response:', { ok: res.ok, status: res.status });
            return res.ok ? res.text() : Promise.reject('VTT not found');
          })
          .then(vttContent => {
            const track = parseVtt(vttContent);
            console.log('[VideoStep] Loaded VTT cues:', track.cues.length, 'cues for', videoPath);
            console.log('[VideoStep] First cue:', track.cues[0]);
            setVideoSubtitleCues(track.cues);
          })
          .catch((err) => {
            console.log('[VideoStep] No VTT file found or error:', err, 'using timer-based display');
            setVideoSubtitleCues([]); // Fall back to timer-based mode
          });

        // Always call play() when starting a new video step
        // This ensures video plays on iOS Safari where state transitions may be delayed
        // Skip only if video is already playing the same video
        const isPlayingSameVideo = videoState === VideoState.PLAYING && currentVideoId === videoPath;
        if (!isPlayingSameVideo) {
          console.log('[VideoStep] Calling play() for video:', videoPath, 'current state:', videoState);
          play(videoPath);
        } else {
          console.log('[VideoStep] Already playing this video, skipping play() call');
        }
      } else {
        // No video - auto-advance after showing text
        setVideoSubtitleCues([]); // No sync mode
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
    videoState,
    currentVideoId,
    play,
  ]);

  // Handle video step completion - advance to next step when video ends
  // Important: Check for ENDED state specifically, not just !isPlaying
  // because isPlaying is false during loading too
  const isVideoEnded = videoState === VideoState.ENDED;

  useEffect(() => {
    console.log('[VideoStepComplete] Check:', {
      isVideoStep,
      isShowingResponse,
      isVideoEnded,
      hasSpokenSummary,
      currentStepIndex,
      videoState,
    });

    // Note: We removed avatarStartedTalking from this check because:
    // 1. hasSpokenSummary indicates we started the video step
    // 2. isVideoEnded (ENDED state) confirms video finished playing
    // 3. avatarStartedTalking can be incorrectly reset by other effects
    if (
      isVideoStep &&
      isShowingResponse &&
      isVideoEnded &&
      hasSpokenSummary
    ) {
      console.log('[VideoStepComplete] All conditions met, starting timer');
      // Video finished - brief moment before advancing
      const timer = setTimeout(() => {
        console.log('[VideoStepComplete] Timer fired, advancing to next step');
        setIsShowingResponse(false);
        setAvatarResponse(null);
        setAvatarStartedTalking(false);
        setHasSpokenSummary(false); // Reset for next video step

        // Advance to next step
        if (currentStepIndex < questionSteps.length - 1) {
          console.log('[VideoStepComplete] Advancing from step', currentStepIndex, 'to', currentStepIndex + 1);
          const nextStep = questionSteps[currentStepIndex + 1];
          const isNextStepQuestion = nextStep?._template === 'questionStep';

          setCurrentStepIndex((prev) => prev + 1);

          // Only show backdrop/question block if next step is a question
          if (isNextStepQuestion) {
            setTimeout(() => {
              console.log('[VideoStepComplete] Next step is question, showing question block');
              setShowBackdrop(true);
              setBackdropHasAnimated(true);
              setShowQuestionBlock(true);
            }, 100);
          } else {
            // For non-question steps (video, email capture, etc.), show question block
            // but hide backdrop - the video step effect will handle video steps
            console.log('[VideoStepComplete] Next step is not a question, showing question block without backdrop');
            setTimeout(() => {
              setShowBackdrop(false);
              setBackdropHasAnimated(false);
              setShowQuestionBlock(true);
            }, 100);
          }
        }
      }, 500); // 500ms delay after video ends before hiding speech bubble
      return () => {
        console.log('[VideoStepComplete] Cleanup - clearing timer');
        clearTimeout(timer);
      };
    }
  }, [
    isVideoStep,
    isShowingResponse,
    isVideoEnded,
    hasSpokenSummary,
    currentStepIndex,
    questionSteps.length,
    videoState, // For logging only
  ]);

  const handleAnswerSelect = useCallback(
    (option: CMSAnswerOption) => {
      setSelectedAnswer(option);

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

      // Log flow data after each answer
      logFlowData(updatedAnswers, `Answer: ${option.label}`);

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

          setShowQuestionBlock(false);
          setShowBackdrop(false); setBackdropHasAnimated(false);
          setAvatarResponse(termMessage);
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
            }, 100);
          } else {
            // Flow complete - hide backdrop
            setShowBackdrop(false); setBackdropHasAnimated(false);
            console.log("Flow complete!");
          }
        }
      }, 400); // Brief pause after selection before moving on
    },
    [
      currentStep,
      currentStepIndex,
      storedAnswers,
      saveProgress,
      flowParam,
      clearProgress,
      questionSteps.length,
      logFlowData,
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

      // Log flow data after mattress selection
      logFlowData(updatedAnswers, `Mattress: ${selection.size} ${selection.feel}`);

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

      // Show avatar response (text only), hide backdrop
      setTimeout(() => {
        setShowQuestionBlock(false);
        setShowBackdrop(false); setBackdropHasAnimated(false);
        setAvatarResponse(response);
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
      logFlowData,
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

      // Log flow data after product selection
      logFlowData(updatedAnswers, `Product: ${selection.mattressName}`);

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

      // Show avatar response (text only), hide backdrop
      setTimeout(() => {
        setShowQuestionBlock(false);
        setShowBackdrop(false); setBackdropHasAnimated(false);
        setAvatarResponse(response);
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
      logFlowData,
    ]
  );

  const handleTextSubmit = useCallback(
    (value: string) => {
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

      // Log flow data after text submission
      logFlowData(updatedAnswers, `Text: ${value}`);

      // Auto-save progress to localStorage
      saveProgress({
        flowId: flowParam,
        currentStepIndex: currentStepIndex + 1, // Save next step index
        answers: updatedAnswers,
      });

      // Get the avatar response (text input doesn't have per-option responses)
      const response = "Thank you! Let me continue with the next question.";

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
      logFlowData,
    ]
  );

  // Handle email submission
  const handleEmailSubmit = useCallback(
    async (email: string) => {
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

      // Log flow data after email submission
      logFlowData(updatedAnswers, `Email: ${email}`);

      // Save progress (don't clear yet - we're continuing to see-options)
      saveProgress({
        flowId: flowParam,
        currentStepIndex: currentStepIndex + 1,
        answers: updatedAnswers,
      });

      // Hide email capture and advance to next step
      setShowQuestionBlock(false);
      setHasSpokenSummary(false); // Reset for next step (especially video steps)

      if (currentStepIndex < questionSteps.length - 1) {
        setCurrentStepIndex((prev) => prev + 1);
        setTimeout(() => {
          setShowQuestionBlock(true);
        }, 100);
      }
    },
    [
      currentStep,
      currentStepIndex,
      storedAnswers,
      saveProgress,
      flowParam,
      questionSteps.length,
      logFlowData,
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

    // Hide email capture and advance to next step
    setShowQuestionBlock(false);
    setHasSpokenSummary(false); // Reset for next step (especially video steps)

    if (currentStepIndex < questionSteps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      setTimeout(() => {
        setShowQuestionBlock(true);
      }, 100);
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
      }, 100);
    }
  }, [currentStepIndex, questionSteps.length]);

  // Handle zipcode submission
  const handleZipCodeSubmit = useCallback(
    async (zipCode: string) => {
      // Store the zipcode for the store locations step
      setUserZipCode(zipCode);

      // Geocode the postal code to get coordinates
      const coordinates = await geocodeWithFallback(zipCode);
      if (coordinates) {
        setUserCoordinates(coordinates);
        console.log('Geocoded postal code:', zipCode, 'to coordinates:', coordinates);
      } else {
        console.warn('Could not geocode postal code:', zipCode);
      }

      // Store as an answer
      const newAnswer: StoredAnswer = {
        stepId: currentStep?.stepId || `step-${currentStepIndex}`,
        questionText: "Postal Code",
        value: zipCode,
        label: zipCode,
        timestamp: new Date(),
      };
      const updatedAnswers = [...storedAnswers, newAnswer];
      setStoredAnswers(updatedAnswers);

      // Log flow data after zip code submission
      logFlowData(updatedAnswers, `Postal Code: ${zipCode}`);

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
        }, 100);
      }
    },
    [
      currentStep,
      currentStepIndex,
      storedAnswers,
      saveProgress,
      flowParam,
      questionSteps.length,
      logFlowData,
    ]
  );

  // Handle going back to previous step
  const handleGoBack = useCallback(() => {
    if (currentStepIndex > 0) {
      const newStepIndex = currentStepIndex - 1;

      // Remove the last stored answer (for the current step we're leaving)
      const updatedAnswers = storedAnswers.slice(0, -1);
      setStoredAnswers(updatedAnswers);

      // Go back one step
      setCurrentStepIndex(newStepIndex);

      // Reset UI state
      setSelectedAnswer(null);
      setIsShowingResponse(false);
      setAvatarResponse(null);
      setShowQuestionBlock(true);

      // Update the URL to reflect the new step (1-indexed for URL)
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set("step", String(newStepIndex + 1));
      router.push(`/?${newParams.toString()}`);

      // Save the updated progress
      saveProgress({
        flowId: flowParam,
        currentStepIndex: newStepIndex,
        answers: updatedAnswers,
      });
    }
  }, [currentStepIndex, storedAnswers, saveProgress, flowParam, searchParams, router]);

  // Show next question after avatar response finishes
  // (Skip if in video step - that has its own handler)
  useEffect(() => {
    console.log('[AvatarResponseComplete] Check:', {
      isShowingResponse,
      avatarStartedTalking,
      isVideoPlaying,
      isVideoStep,
      currentStepTemplate: currentStep?._template,
    });
    if (isShowingResponse && avatarStartedTalking && !isVideoPlaying && !isVideoStep) {
      console.log('[AvatarResponseComplete] Conditions met - starting timer to advance');
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
          }, 100);
        } else {
          // End of flow - could navigate to results
          console.log("Flow complete!");
        }
      }, 200);
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
    currentStep?._template,
  ]);

  // Handle tap anywhere on mobile to unmute (only on video steps, not intro)
  const handleScreenTap = useCallback(() => {
    // Only unmute on mobile, on video steps, and only if currently muted
    const isVideoStep = currentStep?._template === 'videoStep';
    if (isMuted && window.innerWidth <= 768 && isVideoStep) {
      setIsMuted(false);
    }
  }, [isMuted, currentStep?._template]);

  return (
    <main
      className={`${styles.main} ${isDevPanelOpen ? styles.devPanelOpen : ''} ${isStoreLocationsStep ? styles.storeLocationsPage : ''}`}
      onClick={handleScreenTap}
    >
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
          {/* Full-width Gradient Overlay at Bottom - hide on store locations step */}
          {!isStoreLocationsStep && <div className={styles.avatarGradientOverlay} />}

          {/* Video Avatar Wrapper - hide on store locations step */}
          {!isStoreLocationsStep && (
            <div className={`${styles.questionWrapper} ${styles.fadeIn}`}>
              <div className={styles.avatarWrapper}>
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
                    wordDelay={0.12}
                    paragraphPauseMs={600}
                    className={styles.speechBubbleContainer}
                  />
                )}

              {/* Avatar Response Bubble - shows after answer selection */}
              {isShowingResponse && avatarResponse && (
                <SpeechBubbleSequence
                  key={`speech-${currentStepIndex}-${currentStep?.stepId || 'unknown'}`}
                  message={avatarResponse}
                  wordDelay={0.15}
                  paragraphPauseMs={600}
                  className={styles.speechBubbleContainer}
                  stayVisible={isVideoPlaying}
                  subtitleCues={isVideoStep && videoSubtitleCues.length > 0 ? videoSubtitleCues : undefined}
                  videoCurrentTime={isVideoStep && videoSubtitleCues.length > 0 ? currentTime : undefined}
                  ctaButtonText={
                    isVideoStep && currentStep?.stepId === 'video-step-2' && !isVideoPlaying
                      ? 'See My Options'
                      : undefined
                  }
                  onCtaClick={
                    isVideoStep && currentStep?.stepId === 'video-step-2'
                      ? handleSeeOptionsClick
                      : undefined
                  }
                />
              )}
              </div>
            </div>
          )}

          {/* Persistent Backdrop - stays visible during question transitions */}
          {(showQuestionBlock || showBackdrop) && (
            <div className={styles.questionBlockWrapper}>
              {/* Hide backdrop on store locations step and video steps to show full view */}
              {!isStoreLocationsStep && !isVideoStep && (
                <div
                  className={`${styles.questionBlockBackdrop} ${(backdropHasAnimated || skipIntro) ? styles.backdropOnly : ''}`}
                />
              )}

              {/* Back Button - shown on steps after the first, uses showBackdrop to stay persistent during transitions */}
              {(showQuestionBlock || showBackdrop) && currentStepIndex > 0 && (
                <button
                  type="button"
                  className={styles.backButton}
                  onClick={handleGoBack}
                  aria-label="Go back to previous question"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Back
                </button>
              )}

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
              {showQuestionBlock &&
                isProductRecommendationsStep && (
                  <div className={styles.productRecommendationsInner}>
                    <ProductRecommendations
                      content={currentStep?.productRecommendationsContent || DEFAULT_PRODUCT_RECOMMENDATIONS}
                      onSelectionComplete={handleProductRecommendationComplete}
                      onContinue={handleProductRecommendationContinue}
                    />
                  </div>
                )}

              {/* Email Capture Step - rendered outside question block for wider layout */}
              {showQuestionBlock &&
                isEmailCaptureStep && (
                  <div key={`email-capture-${currentStepIndex}`} className={styles.emailCaptureWrapper}>
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

              {/* Action Prompt Step */}
              {showQuestionBlock &&
                isSeeOptionsStep && (
                  <div className={styles.questionBlockInner}>
                    <ActionPrompt
                      content={{
                        promptText: currentStep?.promptText,
                        buttonText: currentStep?.buttonText,
                        avatarResponseOnClick: currentStep?.avatarMessage,
                      } as ActionPromptContent}
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
                      userCoordinates={userCoordinates || undefined}
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
        showAvatarSection={isStoreLocationsStep}
        avatarVideoSrc={currentStep?.avatarVideoSrc}
        avatarText={currentStep?.avatarText}
        isMuted={isMuted}
      />

      {/* Dev Panel - press "/" to toggle */}
      <DevPanel
        answers={storedAnswers}
        currentStep={currentStepIndex}
        totalSteps={questionSteps.length}
        stepNames={questionSteps.map(
          (step) =>
            (step as FlowStep & { internalName?: string }).internalName ||
            step.stepId
        )}
        stepIds={questionSteps.map((step) => step.stepId)}
        onOpenChange={setIsDevPanelOpen}
        currentView={currentView}
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
