/**
 * Variable Interpolation System for Conversation Flows
 *
 * Supports dynamic variable replacement in all text fields (questions, avatar responses, headlines, etc.)
 *
 * Available Variables:
 * - {keyword}           - The trigger keyword (e.g., "back pain")
 * - {keywordDisplay}    - Formatted keyword (e.g., "Back Pain")
 * - {avatarName}        - Avatar's name (e.g., "Ashley")
 * - {brandName}         - Brand name (e.g., "SleepBetter")
 * - {previousAnswer}    - Last selected answer
 * - {previousAnswerLower} - Lowercase previous answer
 * - {step[N].answer}    - Answer from step N
 * - {step[N].answerLower} - Lowercase step N answer
 * - {thisAnswer}        - Current selection (for response)
 * - {userName}          - User's name (if captured)
 * - {userEmail}         - User's email (if captured)
 */

export interface InterpolationContext {
  keyword: string;
  keywordDisplay: string;
  avatarName: string;
  brandName: string;
  previousAnswer?: string;
  thisAnswer?: string;
  stepAnswers: Record<number, string>;
  userName?: string;
  userEmail?: string;
  customVariables?: Record<string, string>;
}

/**
 * Interpolates variables in a template string using the provided context
 *
 * @param template - The string containing variable placeholders
 * @param context - The context object containing variable values
 * @returns The interpolated string with all variables replaced
 *
 * @example
 * ```ts
 * const result = interpolate(
 *   "Hi {userName}, you mentioned feeling {previousAnswer}. How does {keyword} affect your daily life?",
 *   {
 *     keyword: "back pain",
 *     keywordDisplay: "Back Pain",
 *     avatarName: "Ashley",
 *     brandName: "SleepBetter",
 *     previousAnswer: "Tightness",
 *     stepAnswers: { 1: "Tightness", 2: "Morning" },
 *     userName: "John"
 *   }
 * );
 * // Returns: "Hi John, you mentioned feeling Tightness. How does back pain affect your daily life?"
 * ```
 */
export function interpolate(
  template: string,
  context: InterpolationContext
): string {
  if (!template) return "";

  let result = template;

  // Simple replacements
  result = result.replace(/\{keyword\}/g, context.keyword || "");
  result = result.replace(/\{keywordDisplay\}/g, context.keywordDisplay || "");
  result = result.replace(/\{avatarName\}/g, context.avatarName || "");
  result = result.replace(/\{brandName\}/g, context.brandName || "");
  result = result.replace(
    /\{previousAnswer\}/g,
    context.previousAnswer || ""
  );
  result = result.replace(
    /\{previousAnswerLower\}/g,
    (context.previousAnswer || "").toLowerCase()
  );
  result = result.replace(/\{thisAnswer\}/g, context.thisAnswer || "");
  result = result.replace(
    /\{thisAnswerLower\}/g,
    (context.thisAnswer || "").toLowerCase()
  );
  result = result.replace(/\{userName\}/g, context.userName || "");
  result = result.replace(/\{userEmail\}/g, context.userEmail || "");

  // Step-specific replacements: {step[2].answer}
  result = result.replace(
    /\{step\[(\d+)\]\.answer\}/g,
    (_match, stepNum) => {
      return context.stepAnswers[parseInt(stepNum)] || "";
    }
  );

  // Step-specific lowercase: {step[2].answerLower}
  result = result.replace(
    /\{step\[(\d+)\]\.answerLower\}/g,
    (_match, stepNum) => {
      return (context.stepAnswers[parseInt(stepNum)] || "").toLowerCase();
    }
  );

  // Custom variables
  if (context.customVariables) {
    for (const [key, value] of Object.entries(context.customVariables)) {
      const regex = new RegExp(`\\{${key}\\}`, "g");
      result = result.replace(regex, value || "");
    }
  }

  return result;
}

/**
 * Creates a context object from flow global variables and conversation state
 */
export function createInterpolationContext(
  flowGlobalVariables: {
    avatarName?: string;
    brandName?: string;
    customVar1?: string;
    customVar2?: string;
  },
  keyword: {
    slug: string;
    displayName: string;
  },
  conversationState: {
    stepAnswers: Record<number, string>;
    currentAnswer?: string;
    userName?: string;
    userEmail?: string;
  }
): InterpolationContext {
  const stepAnswerValues = Object.values(conversationState.stepAnswers);
  const previousAnswer =
    stepAnswerValues.length > 0
      ? stepAnswerValues[stepAnswerValues.length - 1]
      : undefined;

  return {
    keyword: keyword.slug.replace(/-/g, " "),
    keywordDisplay: keyword.displayName,
    avatarName: flowGlobalVariables.avatarName || "",
    brandName: flowGlobalVariables.brandName || "",
    previousAnswer,
    thisAnswer: conversationState.currentAnswer,
    stepAnswers: conversationState.stepAnswers,
    userName: conversationState.userName,
    userEmail: conversationState.userEmail,
    customVariables: {
      customVar1: flowGlobalVariables.customVar1 || "",
      customVar2: flowGlobalVariables.customVar2 || "",
    },
  };
}

/**
 * Lists all variables found in a template string (useful for validation/debugging)
 */
export function extractVariables(template: string): string[] {
  if (!template) return [];

  const matches = template.match(/\{[^}]+\}/g);
  return matches ? [...new Set(matches)] : [];
}

/**
 * Validates that all variables in a template can be resolved with the given context
 */
export function validateTemplate(
  template: string,
  context: InterpolationContext
): { valid: boolean; missingVariables: string[] } {
  const variables = extractVariables(template);
  const missingVariables: string[] = [];

  const knownVariables = new Set([
    "{keyword}",
    "{keywordDisplay}",
    "{avatarName}",
    "{brandName}",
    "{previousAnswer}",
    "{previousAnswerLower}",
    "{thisAnswer}",
    "{thisAnswerLower}",
    "{userName}",
    "{userEmail}",
  ]);

  // Check for step-specific patterns
  const stepPattern = /^\{step\[\d+\]\.(answer|answerLower)\}$/;

  for (const variable of variables) {
    if (knownVariables.has(variable)) continue;
    if (stepPattern.test(variable)) continue;

    // Check custom variables
    if (context.customVariables) {
      const varName = variable.slice(1, -1); // Remove { and }
      if (context.customVariables[varName] !== undefined) continue;
    }

    missingVariables.push(variable);
  }

  return {
    valid: missingVariables.length === 0,
    missingVariables,
  };
}
