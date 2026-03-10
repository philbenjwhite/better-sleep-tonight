import { StepIndicatorStep } from "@/components/StepIndicator";
import { StoredAnswer } from "@/components/DevPanel";
import { MattressSize, MattressFeel } from "@/components/MattressRecommendation";
import { RESULTS_TEMPLATES } from "./constants";

export function getProgressSteps(
  currentView: "intro" | "question",
  currentStepTemplate: string | undefined,
): StepIndicatorStep[] {
  if (currentView === "intro") {
    return [
      { label: "Intro", status: "active" },
      { label: "Sleep Diagnosis", status: "inactive" },
      { label: "Results", status: "inactive" },
    ];
  }

  const isResultsPhase = currentStepTemplate
    ? RESULTS_TEMPLATES.has(currentStepTemplate)
    : false;

  if (isResultsPhase) {
    return [
      { label: "Intro", status: "completed" },
      { label: "Sleep Diagnosis", status: "completed" },
      { label: "Results", status: "active" },
    ];
  }

  return [
    { label: "Intro", status: "completed" },
    { label: "Sleep Diagnosis", status: "active" },
    { label: "Results", status: "inactive" },
  ];
}

export interface BuildFlowDataParams {
  flowId: string;
  currentStepIndex: number;
  totalSteps: number;
  userZipCode: string | null;
  selectedMattressSize: MattressSize | null | undefined;
  selectedMattressFeel: MattressFeel | null | undefined;
  answers: StoredAnswer[];
}

export function buildFlowData(params: BuildFlowDataParams) {
  const {
    flowId,
    currentStepIndex,
    totalSteps,
    userZipCode,
    selectedMattressSize,
    selectedMattressFeel,
    answers,
  } = params;

  return {
    flowId,
    timestamp: new Date().toISOString(),
    sessionData: {
      currentStep: currentStepIndex + 1,
      totalSteps,
      email:
        answers.find((a) => a.stepId === "email-capture")?.value || null,
      zipCode: userZipCode,
      mattressSelection:
        selectedMattressSize && selectedMattressFeel
          ? {
              size: selectedMattressSize,
              feel: selectedMattressFeel,
            }
          : null,
    },
    answers: answers.map(
      ({ stepId, questionText, value, label, timestamp }) => ({
        stepId,
        question: questionText,
        answer: {
          value,
          label,
        },
        answeredAt:
          timestamp instanceof Date ? timestamp.toISOString() : timestamp,
      }),
    ),
  };
}

export function logFlowData(
  params: BuildFlowDataParams,
  context?: string,
) {
  const flowData = buildFlowData(params);
  if (process.env.NODE_ENV === "development") {
    console.log(`\n📋 Flow Data${context ? ` (${context})` : ""}:`);
    console.log(JSON.stringify(flowData, null, 2));
  }
  return flowData;
}
