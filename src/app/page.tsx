"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
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
import type { StoredAnswer } from "@/components/DevPanel";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  SpeechBubbleSequence,
  SubtitleCue,
} from "@/components/SpeechBubbleSequence";
import { parseVtt, getVttPathFromVideo } from "@/lib/subtitles";
import { geocodeWithFallback, Coordinates } from "@/lib/geocoding";
import type {
  MattressSize,
  MattressFeel,
} from "@/components/MattressRecommendation";
import type { EmailCaptureContent } from "@/components/EmailCapture";
import type { ActionPromptContent } from "@/components/ActionPrompt";
import type {
  StoreLocationsContent,
  StoreLocation,
} from "@/components/StoreLocations";
import type { ZipCodeCaptureContent } from "@/components/ZipCodeCapture";
import { StepIndicator } from "@/components/StepIndicator";
import { trackQuizEvent } from "@/lib/analytics/conversionTracking";

// Lazy-load late-stage step components (not needed until user progresses)
const RecoveryModal = dynamic(() =>
  import("@/components/RecoveryModal").then((m) => m.RecoveryModal)
);
const MattressRecommendation = dynamic(() =>
  import("@/components/MattressRecommendation").then(
    (m) => m.MattressRecommendation
  )
);
const ProductRecommendations = dynamic(() =>
  import("@/components/ProductRecommendations").then(
    (m) => m.ProductRecommendations
  )
);
const EmailCapture = dynamic(() =>
  import("@/components/EmailCapture").then((m) => m.EmailCapture)
);
const ActionPrompt = dynamic(() =>
  import("@/components/ActionPrompt").then((m) => m.ActionPrompt)
);
const StoreLocations = dynamic(() =>
  import("@/components/StoreLocations").then((m) => m.StoreLocations)
);
const ZipCodeCapture = dynamic(() =>
  import("@/components/ZipCodeCapture").then((m) => m.ZipCodeCapture)
);
import { useProgressPersistence } from "@/hooks";
import {
  FLOWS,
  MANUAL_CTA_LABELS,
  DEFAULT_PRODUCT_RECOMMENDATIONS,
  getProgressSteps,
  getFlowHeadline,
  getFlowSubheadline,
  logFlowData as logFlowDataUtil,
  type FlowStep,
} from "@/config";

import styles from "./page.module.css";

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
    skipIntro ? "question" : "intro",
  );
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showQuestionBlock, setShowQuestionBlock] = useState(skipIntro);
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStep);
  const [selectedAnswer, setSelectedAnswer] = useState<CMSAnswerOption | null>(
    null,
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
    null,
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
  const [selectedStore, setSelectedStore] = useState<StoreLocation | null>(null);
  const [userCoordinates, setUserCoordinates] = useState<Coordinates | null>(
    null,
  );

  const [videoSubtitleCues, setVideoSubtitleCues] = useState<SubtitleCue[]>([]);

  // Stable session ID for Epsilon event tracking (persists across re-renders, new per page load)
  const sessionId = useMemo(
    () => crypto.randomUUID(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // GA4 step progression tracker — replaces per-step Epsilon tracking
  const trackStepGA4 = useCallback(
    (answer: { stepId: string; value: string; label: string }) => {
      trackQuizEvent("quiz_step", currentStepIndex, {
        step_id: answer.stepId,
        flow_id: flowParam,
        answer_value: answer.value,
        answer_label: answer.label,
      });
    },
    [currentStepIndex, flowParam],
  );

  // Video avatar hook
  const {
    videoState,
    isPlaying,
    isNearingEnd,
    play,
    pause,
    preloadMultiple,
    currentTime,
    currentVideoId,
  } = useVideoAvatar();

  // Debug: Log video state changes
  useEffect(() => {
    console.log("[VideoStateChange] videoState:", videoState);
  }, [videoState]);

  // Track when video starts/stops playing (replaces avatarStartedTalking/isAvatarTalking)
  const isVideoPlaying = isPlaying;
  const isVideoReady = videoState !== VideoState.ERROR;

  // Dev mode: auto-play intro video when skipping intro
  useEffect(() => {
    if (skipIntro && videoState === VideoState.IDLE) {
      play("avatar-intro");
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

      const steps = activeFlow.steps as FlowStep[];
      const recoveredStep = steps[savedProgress.currentStepIndex];

      setTimeout(() => {
        setCurrentView("question");
        setIsTransitioning(false);
        // Show question block and play video at the same time so audio/subtitles stay in sync
        setTimeout(() => {
          setShowBackdrop(true);
          setBackdropHasAnimated(true);
          setShowQuestionBlock(true);
          if (recoveredStep?.video) {
            play(recoveredStep.video);
          }
        }, 500);
      }, 500);
    }
  }, [savedProgress, activeFlow, play]);

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
  const introScreen = activeFlow.introScreen as
    | {
        avatarImage?: string;
        backgroundVideo?: string;
        headline: string;
        subheadline: string;
        secondarySubheadline?: string;
        primaryButtonText: string;
        audioNotice?: string;
      }
    | undefined;
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
  const isBookingCtaStep = currentStep?._template === "bookingCtaStep";
  const isQuestionStep = currentStep?._template === "questionStep";

  // Pause video at last subtitle cue end for steps with manual CTA
  // This prevents the fade-to-black at the end of the video
  useEffect(() => {
    const stepId = currentStep?.stepId;
    const hasManualCta = stepId != null && stepId in MANUAL_CTA_LABELS;
    if (!hasManualCta || !isVideoPlaying || videoSubtitleCues.length === 0)
      return;

    const lastCue = videoSubtitleCues[videoSubtitleCues.length - 1];
    if (currentTime >= lastCue.endTime) {
      pause();
    }
  }, [
    currentStep?.stepId,
    isVideoPlaying,
    videoSubtitleCues,
    currentTime,
    pause,
  ]);

  // Debug: Log step and render state
  useEffect(() => {
    console.log("[StepDebug]", {
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
  }, [
    currentStepIndex,
    currentStep,
    showQuestionBlock,
    showBackdrop,
    isZipCodeCaptureStep,
    isVideoStep,
    videoState,
    isShowingResponse,
    avatarStartedTalking,
    hasSpokenSummary,
  ]);

  // Reset hasSpokenSummary when step changes to ensure video steps can play
  useEffect(() => {
    console.log(
      "[StepChange] Resetting hasSpokenSummary for step:",
      currentStepIndex,
    );
    setHasSpokenSummary(false);
  }, [currentStepIndex]);

  // Get intro video from intro screen config (used as background on intro screen)
  const introVideo =
    introScreen?.backgroundVideo || "/uploads/Mattress_Shopping.mp4";

  // Get intro message from the first video step's script (shown in speech bubble during intro)
  const firstVideoStep = questionSteps.find(
    (step) => step._template === "videoStep",
  );
  const introMessage = firstVideoStep?.script || "";

  // Preload only the next upcoming video(s) based on connection quality
  // Runs on intro screen (preloads first video) and on each step change (preloads next videos)
  useEffect(() => {
    const startIndex = currentView === "intro" ? 0 : currentStepIndex + 1;
    const upcomingVideos: string[] = [];

    for (let i = startIndex; i < flowSteps.length; i++) {
      const step = flowSteps[i];
      if (step._template === "videoStep" && step.video) {
        upcomingVideos.push(step.video);
      }
      // Also preload idle loop when approaching booking CTA
      if (step._template === "bookingCtaStep") {
        upcomingVideos.push("/videos/ashley/ashley-idle-crf28.mp4");
      }
      // Stop collecting once we have enough candidates — preloadMultiple
      // will limit based on connection quality
      if (upcomingVideos.length >= 3) break;
    }

    if (upcomingVideos.length > 0) {
      preloadMultiple(upcomingVideos);
    }
  }, [currentView, currentStepIndex, flowSteps, preloadMultiple]);

  // Video is ready when not in error state
  const isAvatarReady = isVideoReady;

  const logFlowData = useCallback(
    (answers: StoredAnswer[], context?: string) => {
      return logFlowDataUtil(
        {
          flowId: flowParam,
          currentStepIndex,
          totalSteps: questionSteps.length,
          userZipCode,
          selectedMattressSize,
          selectedMattressFeel,
          answers,
        },
        context,
      );
    },
    [
      flowParam,
      currentStepIndex,
      questionSteps.length,
      userZipCode,
      selectedMattressSize,
      selectedMattressFeel,
    ],
  );

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
    if (currentView === "question" && isVideoPlaying && !hasSpokenIntro) {
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
    console.log("[VideoStep] Check:", {
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
      console.log("[VideoStep] Starting video step:", currentStep.stepId);
      const scriptText = currentStep.script || "";
      const videoPath = currentStep.video;

      // Clear previous subtitle cues before loading new ones
      setVideoSubtitleCues([]);

      // Mark summary as spoken so we don't repeat it
      setHasSpokenSummary(true);

      // Hide question block and backdrop, show the script in speech bubble
      setShowQuestionBlock(false);
      setShowBackdrop(false);
      setBackdropHasAnimated(false);
      setAvatarResponse(scriptText);
      setIsShowingResponse(true);
      setAvatarStartedTalking(true);

      // If video is specified, play it and fetch VTT subtitles
      if (videoPath) {
        console.log("[VideoStep] Playing video:", videoPath);

        // Fetch VTT file for subtitle timing
        const vttPath = getVttPathFromVideo(videoPath);
        console.log("[VideoStep] Fetching VTT from:", vttPath);
        fetch(vttPath)
          .then((res) => {
            console.log("[VideoStep] VTT fetch response:", {
              ok: res.ok,
              status: res.status,
            });
            return res.ok ? res.text() : Promise.reject("VTT not found");
          })
          .then((vttContent) => {
            const track = parseVtt(vttContent);
            console.log(
              "[VideoStep] Loaded VTT cues:",
              track.cues.length,
              "cues for",
              videoPath,
            );
            console.log("[VideoStep] First cue:", track.cues[0]);
            setVideoSubtitleCues(track.cues);
          })
          .catch((err) => {
            console.log(
              "[VideoStep] No VTT file found or error:",
              err,
              "using timer-based display",
            );
            setVideoSubtitleCues([]); // Fall back to timer-based mode
          });

        // Always call play() when starting a new video step
        // This ensures video plays on iOS Safari where state transitions may be delayed
        // Skip only if video is already playing the same video
        const isPlayingSameVideo =
          videoState === VideoState.PLAYING && currentVideoId === videoPath;
        if (!isPlayingSameVideo) {
          console.log(
            "[VideoStep] Calling play() for video:",
            videoPath,
            "current state:",
            videoState,
          );
          play(videoPath);
        } else {
          console.log(
            "[VideoStep] Already playing this video, skipping play() call",
          );
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
    console.log("[VideoStepComplete] Check:", {
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
    if (isVideoStep && isShowingResponse && isVideoEnded && hasSpokenSummary) {
      // Skip auto-advance for steps that use a manual CTA button
      const stepId = currentStep?.stepId;
      const hasManualCta = stepId != null && stepId in MANUAL_CTA_LABELS;
      if (hasManualCta) {
        console.log(
          "[VideoStepComplete] Step has manual CTA, skipping auto-advance:",
          stepId,
        );
        return;
      }

      console.log("[VideoStepComplete] All conditions met, starting timer");

      // Track video watched event via GA4
      if (currentStep?.stepId) {
        trackStepGA4({
          stepId: currentStep.stepId,
          value: "Y",
          label: "Y",
        });
      }

      // Video finished - brief moment before advancing
      const timer = setTimeout(() => {
        console.log("[VideoStepComplete] Timer fired, advancing to next step");
        setIsShowingResponse(false);
        setAvatarResponse(null);
        setAvatarStartedTalking(false);
        setHasSpokenSummary(false); // Reset for next video step

        // Advance to next step
        if (currentStepIndex < questionSteps.length - 1) {
          console.log(
            "[VideoStepComplete] Advancing from step",
            currentStepIndex,
            "to",
            currentStepIndex + 1,
          );
          const nextStep = questionSteps[currentStepIndex + 1];
          const isNextStepQuestion = nextStep?._template === "questionStep";

          setCurrentStepIndex((prev) => prev + 1);

          // Only show backdrop/question block if next step is a question
          if (isNextStepQuestion) {
            setTimeout(() => {
              console.log(
                "[VideoStepComplete] Next step is question, showing question block",
              );
              setShowBackdrop(true);
              setBackdropHasAnimated(true);
              setShowQuestionBlock(true);
            }, 100);
          } else {
            // For non-question steps (video, email capture, etc.), show question block
            // but hide backdrop - the video step effect will handle video steps
            console.log(
              "[VideoStepComplete] Next step is not a question, showing question block without backdrop",
            );
            setTimeout(() => {
              setShowBackdrop(false);
              setBackdropHasAnimated(false);
              setShowQuestionBlock(true);
            }, 100);
          }
        }
      }, 500); // 500ms delay after video ends before hiding speech bubble
      return () => {
        console.log("[VideoStepComplete] Cleanup - clearing timer");
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
    currentStep?.stepId,
    currentStep?.internalName,
    trackStepGA4,
  ]);

  // Handle booking CTA step - play video and load subtitles
  useEffect(() => {
    if (
      isBookingCtaStep &&
      currentStep &&
      showQuestionBlock &&
      !isShowingResponse
    ) {
      const scriptText = currentStep.script || "";
      const videoPath = currentStep.video;

      setVideoSubtitleCues([]);
      setAvatarResponse(scriptText);
      setIsShowingResponse(true);

      if (videoPath) {
        const vttPath = getVttPathFromVideo(videoPath);
        fetch(vttPath)
          .then((res) =>
            res.ok ? res.text() : Promise.reject("VTT not found"),
          )
          .then((vttContent) => {
            const track = parseVtt(vttContent);
            setVideoSubtitleCues(track.cues);
          })
          .catch(() => {
            setVideoSubtitleCues([]);
          });

        const isPlayingSameVideo =
          videoState === VideoState.PLAYING && currentVideoId === videoPath;
        if (!isPlayingSameVideo) {
          play(videoPath);
        }
      }
    }
  }, [
    isBookingCtaStep,
    currentStep,
    showQuestionBlock,
    isShowingResponse,
    videoState,
    currentVideoId,
    play,
  ]);

  // When booking CTA video ends, switch to looping idle video
  useEffect(() => {
    if (
      isBookingCtaStep &&
      videoState === VideoState.ENDED &&
      currentVideoId === currentStep?.video
    ) {
      play("/videos/ashley/ashley-idle-crf28.mp4", { loop: true });
    }
  }, [isBookingCtaStep, videoState, currentVideoId, currentStep?.video, play]);

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
      trackStepGA4(newAnswer);

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
          setShowBackdrop(false);
          setBackdropHasAnimated(false);
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
          setShowBackdrop(true);
          setBackdropHasAnimated(true);
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
            setShowBackdrop(false);
            setBackdropHasAnimated(false);
            console.log("Flow complete!");
          }
        }
      }, 1000); // Pause after selection so user sees their choice before moving on
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
      trackStepGA4,
    ],
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
      trackStepGA4(newAnswer);

      // Log flow data after mattress selection
      logFlowData(
        updatedAnswers,
        `Mattress: ${selection.size} ${selection.feel}`,
      );

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
        setShowBackdrop(false);
        setBackdropHasAnimated(false);
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
      trackStepGA4,
    ],
  );

  // Handle "Book a Rest Test" button - advances directly to the next step
  const handleBookRestTest = useCallback(() => {
    // Determine which product IDs were shown based on sleep-alone answer
    const sleepAlone =
      storedAnswers.find((a) => a.stepId === "q6-sleep-alone-or-partner")
        ?.value === "alone";
    const recommendations =
      currentStep?.productRecommendationsContent?.mattressOptions ||
      DEFAULT_PRODUCT_RECOMMENDATIONS.mattressOptions;
    const shownProducts = sleepAlone
      ? recommendations.slice(0, 2)
      : recommendations;
    const productIds = shownProducts.map((p) => p.id).join(",");

    const newAnswer: StoredAnswer = {
      stepId: currentStep?.stepId || `step-${currentStepIndex}`,
      questionText: "Product Recommendation",
      value: productIds,
      label: `Book a Rest Test (${productIds})`,
      timestamp: new Date(),
    };
    const updatedAnswers = [...storedAnswers, newAnswer];
    setStoredAnswers(updatedAnswers);
    trackStepGA4(newAnswer);

    logFlowData(updatedAnswers, "Book a Rest Test");

    saveProgress({
      flowId: flowParam,
      currentStepIndex: currentStepIndex + 1,
      answers: updatedAnswers,
    });

    // Advance directly to the next step — keep backdrop visible during transition
    setShowBackdrop(true);
    setBackdropHasAnimated(true);
    setShowQuestionBlock(false);
    setHasSpokenSummary(false);

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
    logFlowData,
    trackStepGA4,
  ]);

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
      trackStepGA4(newAnswer);

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
      setShowBackdrop(false);
      setBackdropHasAnimated(false);
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
      trackStepGA4,
    ],
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
      trackStepGA4(newAnswer);

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
      trackStepGA4,
    ],
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
    trackStepGA4(newAnswer);

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
    trackStepGA4,
  ]);

  // Handle see options button click (CTA at end of summary video)
  const handleSeeOptionsClick = useCallback(() => {
    console.log("See options clicked — advancing to product recommendations");

    // Track video watched event via GA4
    if (currentStep?.stepId) {
      trackStepGA4({
        stepId: currentStep.stepId,
        value: "Y",
        label: "Y",
      });
    }

    // Clear video/speech state so we transition cleanly
    setIsShowingResponse(false);
    setAvatarResponse(null);
    setAvatarStartedTalking(false);
    setHasSpokenSummary(false);
    setShowBackdrop(true);
    setBackdropHasAnimated(true);
    setShowQuestionBlock(false);

    if (currentStepIndex < questionSteps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      setTimeout(() => {
        setShowQuestionBlock(true);
      }, 100);
    }
  }, [currentStepIndex, questionSteps.length, currentStep, trackStepGA4]);

  // Handle zipcode submission
  const handleZipCodeSubmit = useCallback(
    async (zipCode: string) => {
      // Store the zipcode for the store locations step
      setUserZipCode(zipCode);

      // Geocode the postal code to get coordinates
      const coordinates = await geocodeWithFallback(zipCode);
      if (coordinates) {
        setUserCoordinates(coordinates);
        console.log(
          "Geocoded postal code:",
          zipCode,
          "to coordinates:",
          coordinates,
        );
      } else {
        console.warn("Could not geocode postal code:", zipCode);
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
      trackStepGA4(newAnswer);

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
      trackStepGA4,
    ],
  );

  // Handle selecting a store location — advances to the next step
  const handleSelectLocation = useCallback(
    (location: StoreLocation) => {
      setSelectedStore(location);
      const newAnswer: StoredAnswer = {
        stepId: currentStep?.stepId || `step-${currentStepIndex}`,
        questionText: "Store Location",
        value: location.id,
        label: `${location.city} - ${location.storeName}`,
        timestamp: new Date(),
      };
      const updatedAnswers = [...storedAnswers, newAnswer];
      setStoredAnswers(updatedAnswers);
      trackStepGA4(newAnswer);

      logFlowData(updatedAnswers, `Store: ${location.storeName}`);

      saveProgress({
        flowId: flowParam,
        currentStepIndex: currentStepIndex + 1,
        answers: updatedAnswers,
      });

      setShowQuestionBlock(false);
      setHasSpokenSummary(false);

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
      trackStepGA4,
    ],
  );

  // Handle email submission on the booking CTA step (gates the Schedule Appointment button)
  const handleBookingEmailSubmit = useCallback(
    async (email: string) => {
      const newAnswer: StoredAnswer = {
        stepId: "booking-cta-step",
        questionText: "Booking Email",
        value: email,
        label: email,
        timestamp: new Date(),
      };
      const updatedAnswers = [...storedAnswers, newAnswer];
      setStoredAnswers(updatedAnswers);
      trackStepGA4(newAnswer);
      logFlowData(updatedAnswers, `Booking Email: ${email}`);

      // Push full contact record to Epsilon CRM via API route
      try {
        await fetch("/api/epsilon/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            email,
            postalCode: userZipCode || undefined,
            flowId: flowParam,
            selectedStore: selectedStore
              ? {
                  id: selectedStore.id,
                  storeName: selectedStore.storeName,
                  city: selectedStore.city,
                }
              : undefined,
            answers: updatedAnswers.map((a) => ({
              stepId: a.stepId,
              questionText: a.questionText,
              value: a.value,
              label: a.label,
            })),
          }),
        });
      } catch (err) {
        // Log but don't block the redirect
        console.error("[Epsilon] Submit failed:", err);
      }

      // Redirect to appointment page
      window.open(
        "https://ashleyhomestore.ca/pages/book-appointment",
        "_blank",
      );
    },
    [storedAnswers, logFlowData, trackStepGA4, sessionId, userZipCode, flowParam, selectedStore],
  );

  // Show next question after avatar response finishes
  // (Skip if in video step or booking CTA step - those have their own handlers)
  useEffect(() => {
    console.log("[AvatarResponseComplete] Check:", {
      isShowingResponse,
      avatarStartedTalking,
      isVideoPlaying,
      isVideoStep,
      isBookingCtaStep,
      currentStepTemplate: currentStep?._template,
    });
    if (
      isShowingResponse &&
      avatarStartedTalking &&
      !isVideoPlaying &&
      !isVideoStep &&
      !isBookingCtaStep
    ) {
      console.log(
        "[AvatarResponseComplete] Conditions met - starting timer to advance",
      );
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
    isBookingCtaStep,
    currentStepIndex,
    questionSteps.length,
    isFlowTerminated,
    currentStep?._template,
  ]);

  // Handle tap anywhere on mobile to unmute (only on video steps, not intro)
  const handleScreenTap = useCallback(() => {
    // Only unmute on mobile, on video steps, and only if currently muted
    const isVideoStep = currentStep?._template === "videoStep";
    if (isMuted && window.innerWidth <= 768 && isVideoStep) {
      setIsMuted(false);
    }
  }, [isMuted, currentStep?._template]);

  return (
    <main
      className={`${styles.main} ${
        isStoreLocationsStep ? styles.storeLocationsPage : ""
      } ${
        isProductRecommendationsStep ? styles.productRecommendationsPage : ""
      } ${isBookingCtaStep ? styles.bookingCtaPage : ""}`}
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

      {/* Header with Logo, Step Indicator, and Volume Button */}
      <Header
        brandName={activeFlow.globalVariables.brandName}
        isMuted={isMuted}
        onVolumeClick={handleVolumeToggle}
        centerContent={
          <StepIndicator
            steps={getProgressSteps(currentView, currentStep?._template)}
          />
        }
        mobileContent={
          <StepIndicator
            steps={getProgressSteps(currentView, currentStep?._template)}
          />
        }
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
                alt={`${
                  activeFlow.globalVariables.avatarName || "Ashley"
                }, your BetterSleep AI Coach`}
                width={256}
                height={245}
                className={styles.avatar}
                priority
              />
            </div>

            {/* Text Content */}
            <div className={styles.textContent}>
              <h1 className={styles.titlePage}>{getFlowHeadline(flowParam)}</h1>
              <p className={styles.subheadline}>{getFlowSubheadline(flowParam, introScreen.subheadline)}</p>
              {introScreen.secondarySubheadline && (
                <p className={styles.subheadline}>
                  {introScreen.secondarySubheadline}
                </p>
              )}
            </div>

            {/* CTA Section */}
            <div className={styles.ctaSection}>
              {introScreen.audioNotice && (
                <p className={styles.audioNotice}>{introScreen.audioNotice}</p>
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
          {/* Video Avatar Wrapper - hide on store locations / product recommendations step */}
          {!isStoreLocationsStep && !isProductRecommendationsStep && (
            <div className={`${styles.questionWrapper} ${styles.fadeIn}`}>
              {/* Full-width Gradient Overlay at Bottom - above avatar, below chat bubbles */}
              {!isStoreLocationsStep &&
                !isBookingCtaStep &&
                !isProductRecommendationsStep && (
                  <div className={styles.avatarGradientOverlay} />
                )}
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

                {/* Avatar Response Bubble - shows after answer selection (not on booking CTA step) */}
                {isShowingResponse && avatarResponse && !isBookingCtaStep && (
                  <SpeechBubbleSequence
                    key={`speech-${currentStepIndex}-${
                      currentStep?.stepId || "unknown"
                    }`}
                    message={avatarResponse}
                    wordDelay={0.15}
                    paragraphPauseMs={600}
                    className={styles.speechBubbleContainer}
                    stayVisible={
                      isVideoPlaying ||
                      (isVideoStep &&
                        currentStep?.stepId != null &&
                        currentStep.stepId in MANUAL_CTA_LABELS)
                    }
                    subtitleCues={
                      isVideoStep && videoSubtitleCues.length > 0
                        ? videoSubtitleCues
                        : undefined
                    }
                    videoCurrentTime={
                      isVideoStep && videoSubtitleCues.length > 0
                        ? currentTime
                        : undefined
                    }
                    ctaButtonText={
                      isVideoStep && !isVideoPlaying
                        ? MANUAL_CTA_LABELS[currentStep?.stepId ?? ""]
                        : undefined
                    }
                    onCtaClick={
                      isVideoStep &&
                      currentStep?.stepId != null &&
                      currentStep.stepId in MANUAL_CTA_LABELS
                        ? handleSeeOptionsClick
                        : undefined
                    }
                  />
                )}

                {/* Booking CTA Speech Bubble - bottom-aligned over avatar, no tail */}
                {isBookingCtaStep && showQuestionBlock && avatarResponse && (
                  <SpeechBubbleSequence
                    key="booking-cta-speech"
                    message={avatarResponse}
                    wordDelay={0.15}
                    paragraphPauseMs={600}
                    className={styles.bookingCtaBubbleContainer}
                    stayVisible
                    hideTail
                    subtitleCues={
                      videoSubtitleCues.length > 0 &&
                      currentVideoId === currentStep?.video
                        ? videoSubtitleCues
                        : undefined
                    }
                    videoCurrentTime={
                      videoSubtitleCues.length > 0 &&
                      currentVideoId === currentStep?.video
                        ? currentTime
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
              {/* Hide backdrop on store locations, booking CTA, and video steps to show full view */}
              {!isStoreLocationsStep && !isBookingCtaStep && !isVideoStep && (
                <div
                  className={`${styles.questionBlockBackdrop} ${
                    backdropHasAnimated || skipIntro ? styles.backdropOnly : ""
                  }`}
                />
              )}

              {/* Question Block Content */}
              {showQuestionBlock &&
                isQuestionStep &&
                currentStep?.questionText && (
                  <div className={styles.questionBlockInner}>
                    <AnimatedQuestionBlock
                      questionContent={
                        {
                          questionText: currentStep.questionText,
                          inputType: currentStep.inputType,
                          helperText: currentStep.helperText,
                          isRequired: currentStep.isRequired,
                          answerOptions: currentStep.answerOptions,
                        } as CMSQuestionContent
                      }
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
              {showQuestionBlock && isProductRecommendationsStep && (
                <div className={styles.productRecommendationsInner}>
                  <ProductRecommendations
                    content={
                      currentStep?.productRecommendationsContent ||
                      DEFAULT_PRODUCT_RECOMMENDATIONS
                    }
                    maxItems={
                      storedAnswers.find(
                        (a) => a.stepId === "q6-sleep-alone-or-partner",
                      )?.value === "alone"
                        ? 2
                        : undefined
                    }
                    purchaseIntent={
                      storedAnswers.find(
                        (a) => a.stepId === "q7-purchase-intent",
                      )?.value as
                        | "ready-to-buy"
                        | "not-ready-to-buy"
                        | undefined
                    }
                    onBookRestTest={handleBookRestTest}
                  />
                </div>
              )}

              {/* Email Capture Step - rendered outside question block for wider layout */}
              {showQuestionBlock && isEmailCaptureStep && (
                <div
                  key={`email-capture-${currentStepIndex}`}
                  className={styles.emailCaptureWrapper}
                >
                  <EmailCapture
                    content={
                      {
                        promptText: currentStep?.promptText,
                        placeholderText: currentStep?.placeholderText,
                        submitButtonText: currentStep?.submitButtonText,
                        avatarResponseOnSubmit:
                          currentStep?.avatarResponseOnSubmit,
                      } as EmailCaptureContent
                    }
                    onSubmit={handleEmailSubmit}
                    onSkip={handleEmailSkip}
                  />
                </div>
              )}

              {/* Action Prompt Step */}
              {showQuestionBlock && isSeeOptionsStep && (
                <div className={styles.questionBlockInner}>
                  <ActionPrompt
                    content={
                      {
                        promptText: currentStep?.promptText,
                        buttonText: currentStep?.buttonText,
                        avatarResponseOnClick: currentStep?.avatarMessage,
                      } as ActionPromptContent
                    }
                    onContinue={handleSeeOptionsClick}
                  />
                </div>
              )}

              {/* Zip Code Capture Step */}
              {showQuestionBlock && isZipCodeCaptureStep && (
                <div className={styles.questionBlockInner}>
                  <ZipCodeCapture
                    content={
                      {
                        headline: currentStep?.headline,
                        placeholderText: currentStep?.placeholderText,
                        buttonText: currentStep?.buttonText,
                      } as ZipCodeCaptureContent
                    }
                    onSubmit={handleZipCodeSubmit}
                  />
                </div>
              )}

              {/* Store Locations Step */}
              {showQuestionBlock && isStoreLocationsStep && (
                <div className={styles.storeLocationsInner}>
                  <StoreLocations
                    content={
                      {
                        headerText: currentStep?.headerText,
                        defaultPostalCode: currentStep?.defaultPostalCode,
                        ctaBookTitle: currentStep?.ctaBookTitle,
                        ctaBookDescription: currentStep?.ctaBookDescription,
                        ctaBookButtonText: currentStep?.ctaBookButtonText,
                        ctaContactTitle: currentStep?.ctaContactTitle,
                        ctaContactDescription:
                          currentStep?.ctaContactDescription,
                        ctaContactButtonText: currentStep?.ctaContactButtonText,
                      } as StoreLocationsContent
                    }
                    postalCode={
                      userZipCode || currentStep?.defaultPostalCode || ""
                    }
                    userCoordinates={userCoordinates || undefined}
                    hideCtas
                    onSelectLocation={handleSelectLocation}
                  />
                </div>
              )}

              {/* Booking CTA Step - right column */}
              {showQuestionBlock && isBookingCtaStep && (
                <div className={styles.bookingCtaInner}>
                  <StoreLocations
                    content={
                      {
                        headerText: "",
                        ctaBookTitle: currentStep?.ctaBookTitle,
                        ctaBookDescription: currentStep?.ctaBookDescription,
                        ctaBookButtonText: currentStep?.ctaBookButtonText,
                        ctaContactTitle: currentStep?.ctaContactTitle,
                        ctaContactDescription:
                          currentStep?.ctaContactDescription,
                        ctaContactButtonText: currentStep?.ctaContactButtonText,
                      } as StoreLocationsContent
                    }
                    postalCode=""
                    hideMap
                    stackCtas
                    onEmailSubmit={handleBookingEmailSubmit}
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Footer with Progress Bar */}
      <Footer
        showProgress={false}
        currentStep={currentStepIndex + 1}
        totalSteps={questionSteps.length}
        showAvatarSection={isStoreLocationsStep || isBookingCtaStep}
        avatarVideoSrc={
          isBookingCtaStep
            ? "/videos/ashley/ashley-5-square.mp4"
            : currentStep?.avatarVideoSrc
        }
        avatarText={
          isBookingCtaStep ? avatarResponse ?? undefined : currentStep?.avatarText
        }
        isMuted={isMuted}
        avatarMobileOnly={isBookingCtaStep || isStoreLocationsStep}
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
