import { Collection, TinaField } from "tinacms";

// Answer Options fields (embedded in question steps)
const answerOptionFields: TinaField[] = [
  {
    name: "optionId",
    label: "Option ID",
    type: "string",
    required: true,
  },
  {
    name: "label",
    label: "Display Label",
    type: "string",
    required: true,
  },
  {
    name: "value",
    label: "Value",
    type: "string",
    required: true,
  },
  {
    name: "order",
    label: "Order",
    type: "number",
  },
  {
    name: "avatarResponse",
    label: "Avatar Response",
    type: "string",
    ui: { component: "textarea" },
    description:
      "What the avatar says when this option is selected. Supports {thisAnswer}, {previousAnswer}, etc.",
  },
  {
    name: "avatarEmotion",
    label: "Avatar Emotion",
    type: "string",
    options: [
      { value: "excited", label: "Excited" },
      { value: "serious", label: "Serious" },
      { value: "friendly", label: "Friendly" },
      { value: "soothing", label: "Soothing" },
      { value: "broadcaster", label: "Broadcaster" },
    ],
    description: "Voice emotion when speaking this response",
  },
  {
    name: "nextStepOverride",
    label: "Skip to Step (Optional)",
    type: "string",
    description: "Step ID to jump to (for branching logic)",
  },
  {
    name: "terminateFlow",
    label: "Terminate Flow",
    type: "boolean",
    description:
      "End the flow with a termination message if this option is selected",
  },
  {
    name: "terminationMessage",
    label: "Termination Message",
    type: "string",
    ui: { component: "textarea" },
    description: "Message shown when flow is terminated (avatar script)",
  },
  {
    name: "tags",
    label: "Tags",
    type: "string",
    list: true,
    description: "For analytics/categorization",
  },
];

// HeyGen SDK voice emotions - used across all avatar text fields
const voiceEmotionOptions = [
  { value: "excited", label: "Excited" },
  { value: "serious", label: "Serious" },
  { value: "friendly", label: "Friendly" },
  { value: "soothing", label: "Soothing" },
  { value: "broadcaster", label: "Broadcaster" },
];

// Intro content fields
const introContentFields: TinaField[] = [
  {
    name: "headline",
    label: "Headline",
    type: "string",
  },
  {
    name: "subheadline",
    label: "Subheadline",
    type: "string",
    ui: { component: "textarea" },
  },
  {
    name: "secondarySubheadline",
    label: "Secondary Subheadline",
    type: "string",
    ui: { component: "textarea" },
    description: "Additional subheadline text shown below the main intro",
  },
  {
    name: "audioNotice",
    label: "Audio Notice",
    type: "string",
    description: "Notice about audio/volume requirements",
  },
  {
    name: "primaryButtonText",
    label: "Primary Button Text",
    type: "string",
  },
];

// Question content fields
const questionContentFields: TinaField[] = [
  {
    name: "questionText",
    label: "Question Text",
    type: "string",
    ui: { component: "textarea" },
    description: "Supports variables like {previousAnswer}, {keyword}",
  },
  {
    name: "inputType",
    label: "Input Type",
    type: "string",
    options: [
      { value: "radio", label: "Radio Buttons" },
      { value: "dropdown", label: "Dropdown" },
      { value: "checkbox", label: "Checkboxes" },
      { value: "button-group", label: "Button Group" },
    ],
  },
  {
    name: "helperText",
    label: "Helper Text",
    type: "string",
  },
  {
    name: "isRequired",
    label: "Required",
    type: "boolean",
  },
  {
    name: "answerOptions",
    label: "Answer Options",
    type: "object",
    list: true,
    ui: {
      itemProps: (item) => ({
        label: item?.label || "New Option",
      }),
    },
    fields: answerOptionFields,
  },
];

// Avatar content fields (for monologue/transition steps)
const avatarContentFields: TinaField[] = [
  {
    name: "scriptText",
    label: "Avatar Script",
    type: "string",
    ui: { component: "textarea" },
    description: "What the avatar says. Supports variables.",
  },
  {
    name: "secondaryScriptText",
    label: "Secondary Script",
    type: "string",
    ui: { component: "textarea" },
    description: "Additional script section for multi-part monologues",
  },
  {
    name: "tertiaryScriptText",
    label: "Tertiary Script",
    type: "string",
    ui: { component: "textarea" },
    description: "Third script section for extended monologues",
  },
  {
    name: "emotion",
    label: "Emotion",
    type: "string",
    options: voiceEmotionOptions,
    description: "Voice emotion when speaking this script",
  },
  {
    name: "gestureHint",
    label: "Gesture Hint",
    type: "string",
  },
  {
    name: "pauseAfterMs",
    label: "Pause After (ms)",
    type: "number",
  },
  {
    name: "autoAdvance",
    label: "Auto-Advance",
    type: "boolean",
  },
  {
    name: "autoAdvanceDelayMs",
    label: "Auto-Advance Delay (ms)",
    type: "number",
  },
];

// Email capture content fields
const emailCaptureContentFields: TinaField[] = [
  {
    name: "promptText",
    label: "Prompt Text",
    type: "string",
  },
  {
    name: "placeholderText",
    label: "Placeholder",
    type: "string",
  },
  {
    name: "submitButtonText",
    label: "Submit Button Text",
    type: "string",
  },
  {
    name: "avatarResponseOnSubmit",
    label: "Avatar Response",
    type: "string",
    ui: { component: "textarea" },
  },
];

// Video step content fields
const videoContentFields: TinaField[] = [
  {
    name: "video",
    label: "Video",
    type: "image",
    description: "Video file to play during this step",
  },
  {
    name: "script",
    label: "Script",
    type: "string",
    ui: { component: "textarea" },
    description: "Text displayed in the speech bubble (should match the video)",
  },
];

// CTA content fields
const ctaContentFields: TinaField[] = [
  {
    name: "headline",
    label: "Headline",
    type: "string",
  },
  {
    name: "bodyText",
    label: "Body Text",
    type: "string",
    ui: { component: "textarea" },
  },
  {
    name: "primaryButtonText",
    label: "Primary Button",
    type: "string",
  },
  {
    name: "primaryButtonUrl",
    label: "Primary Button URL",
    type: "string",
  },
  {
    name: "secondaryButtonText",
    label: "Secondary Button",
    type: "string",
  },
  {
    name: "secondaryButtonUrl",
    label: "Secondary Button URL",
    type: "string",
  },
];

// Step fields
const stepFields: TinaField[] = [
  {
    name: "stepId",
    label: "Step ID",
    type: "string",
    required: true,
  },
  {
    name: "internalName",
    label: "Internal Name",
    type: "string",
    description: "Admin-friendly name for this step",
  },
  {
    name: "order",
    label: "Order",
    type: "number",
    required: true,
  },
  {
    name: "stepType",
    label: "Step Type",
    type: "string",
    options: [
      { value: "intro", label: "Intro" },
      { value: "question", label: "Question" },
      { value: "avatar-monologue", label: "Avatar Monologue" },
      { value: "transition", label: "Transition" },
      { value: "video", label: "Video" },
      { value: "email-capture", label: "Email Capture" },
      { value: "see-options", label: "See Options Prompt" },
      { value: "product-recommendations", label: "Product Recommendations" },
      { value: "zipcode-capture", label: "Zip Code Capture" },
      { value: "store-locations", label: "Store Locations" },
      { value: "cta", label: "Call to Action" },
      { value: "results", label: "Results Summary" },
    ],
    required: true,
  },
  {
    name: "introContent",
    label: "Intro Content",
    type: "object",
    fields: introContentFields,
  },
  {
    name: "questionContent",
    label: "Question Content",
    type: "object",
    fields: questionContentFields,
  },
  {
    name: "avatarContent",
    label: "Avatar Content",
    type: "object",
    fields: avatarContentFields,
  },
  {
    name: "emailCaptureContent",
    label: "Email Capture Content",
    type: "object",
    fields: emailCaptureContentFields,
  },
  {
    name: "ctaContent",
    label: "CTA Content",
    type: "object",
    fields: ctaContentFields,
  },
  {
    name: "videoContent",
    label: "Video Content",
    type: "object",
    fields: videoContentFields,
  },
  {
    name: "styling",
    label: "Styling Overrides",
    type: "object",
    fields: [
      {
        name: "backgroundColor",
        label: "Background Color",
        type: "string",
      },
      {
        name: "customCssClass",
        label: "Custom CSS Class",
        type: "string",
      },
    ],
  },
  {
    name: "analytics",
    label: "Analytics",
    type: "object",
    fields: [
      {
        name: "trackingEventName",
        label: "Tracking Event Name",
        type: "string",
      },
      {
        name: "customProperties",
        label: "Custom Properties",
        type: "string",
        ui: { component: "textarea" },
      },
    ],
  },
];

export const flowsCollection: Collection = {
  name: "flows",
  label: "Conversation Flows",
  path: "content/flows",
  format: "json",
  fields: [
    {
      name: "flowId",
      label: "Flow ID",
      type: "string",
      required: true,
      description: "Unique identifier for this flow",
    },
    {
      name: "displayName",
      label: "Display Name",
      type: "string",
      required: true,
    },
    {
      name: "description",
      label: "Description",
      type: "string",
      ui: { component: "textarea" },
    },
    {
      name: "isActive",
      label: "Active",
      type: "boolean",
    },
    {
      name: "introVideo",
      label: "Intro Video",
      type: "image",
      description: "Background video shown on the intro screen",
    },
    {
      name: "avatarIntroScript",
      label: "Video Script",
      type: "string",
      ui: { component: "textarea" },
      description: "What the avatar says during the intro",
    },
    {
      name: "globalVariables",
      label: "Global Variables",
      type: "object",
      fields: [
        {
          name: "brandName",
          label: "Brand Name",
          type: "string",
        },
      ],
    },
    {
      name: "steps",
      label: "Steps",
      type: "object",
      list: true,
      ui: {
        itemProps: (item) => ({
          label: `Step ${item?.order || "?"}: ${
            item?.internalName || item?.stepType || "Untitled"
          }`,
        }),
        defaultItem: {
          order: 1,
          stepType: "question",
        },
      },
      fields: stepFields,
    },
    {
      name: "metadata",
      label: "Metadata",
      type: "object",
      fields: [
        {
          name: "createdAt",
          label: "Created",
          type: "datetime",
        },
        {
          name: "updatedAt",
          label: "Last Updated",
          type: "datetime",
        },
        {
          name: "author",
          label: "Author",
          type: "string",
        },
        {
          name: "version",
          label: "Version",
          type: "string",
        },
      ],
    },
  ],
  ui: {
    filename: {
      readonly: true,
      slugify: (values) => values?.flowId || "new-flow",
    },
  },
};
