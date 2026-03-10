import { CMSAnswerOption } from "@/components/QuestionBlock";
import { MattressRecommendationContent } from "@/components/MattressRecommendation";
import { ProductRecommendationsContent } from "@/components/ProductRecommendations";

// Type for flow steps - using template-based structure
// Each step has _template to identify its type, and fields are at the top level
export interface FlowStep {
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
  // Shared fields (used by zipcode capture, etc.)
  promptText?: string;
  placeholderText?: string;
  submitButtonText?: string;
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
