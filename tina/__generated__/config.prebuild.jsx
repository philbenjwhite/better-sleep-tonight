// tina/config.ts
import { defineConfig } from "tinacms";

// tina/collections/stepTypes.ts
var stepTypesCollection = {
  name: "stepTypes",
  label: "Step Types",
  path: "content/stepTypes",
  format: "json",
  fields: [
    {
      name: "slug",
      label: "Slug",
      type: "string",
      required: true
    },
    {
      name: "displayName",
      label: "Display Name",
      type: "string",
      required: true
    },
    {
      name: "description",
      label: "Description",
      type: "string"
    },
    {
      name: "icon",
      label: "Admin Icon",
      type: "string",
      description: "Icon name for admin UI"
    },
    {
      name: "requiresUserInput",
      label: "Requires User Input",
      type: "boolean"
    },
    {
      name: "hasAvatarResponse",
      label: "Has Avatar Response",
      type: "boolean"
    }
  ],
  ui: {
    filename: {
      readonly: true,
      slugify: (values) => values?.slug || "new-step-type"
    }
  }
};

// tina/collections/inputTypes.ts
var inputTypesCollection = {
  name: "inputTypes",
  label: "Input Types",
  path: "content/inputTypes",
  format: "json",
  fields: [
    {
      name: "slug",
      label: "Slug",
      type: "string",
      required: true
    },
    {
      name: "displayName",
      label: "Display Name",
      type: "string",
      required: true
    },
    {
      name: "description",
      label: "Description",
      type: "string"
    },
    {
      name: "allowsMultiple",
      label: "Allows Multiple Selection",
      type: "boolean"
    },
    {
      name: "hasOptions",
      label: "Has Predefined Options",
      type: "boolean",
      description: "Whether this type uses answer options (vs free text)"
    },
    {
      name: "validationPattern",
      label: "Validation Regex",
      type: "string",
      description: "Optional regex for validation"
    }
  ],
  ui: {
    filename: {
      readonly: true,
      slugify: (values) => values?.slug || "new-input-type"
    }
  }
};

// tina/collections/flows.ts
var answerOptionFields = [
  {
    name: "optionId",
    label: "Option ID",
    type: "string",
    required: true
  },
  {
    name: "label",
    label: "Display Label",
    type: "string",
    required: true
  },
  {
    name: "value",
    label: "Value",
    type: "string",
    required: true
  },
  {
    name: "order",
    label: "Order",
    type: "number"
  },
  {
    name: "avatarResponse",
    label: "Avatar Response",
    type: "string",
    ui: { component: "textarea" },
    description: "What the avatar says when this option is selected. Supports {thisAnswer}, {previousAnswer}, etc."
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
      { value: "broadcaster", label: "Broadcaster" }
    ],
    description: "Voice emotion when speaking this response"
  },
  {
    name: "nextStepOverride",
    label: "Skip to Step (Optional)",
    type: "string",
    description: "Step ID to jump to (for branching logic)"
  },
  {
    name: "tags",
    label: "Tags",
    type: "string",
    list: true,
    description: "For analytics/categorization"
  }
];
var voiceEmotionOptions = [
  { value: "excited", label: "Excited" },
  { value: "serious", label: "Serious" },
  { value: "friendly", label: "Friendly" },
  { value: "soothing", label: "Soothing" },
  { value: "broadcaster", label: "Broadcaster" }
];
var headerContentFields = [
  {
    name: "headline",
    label: "Headline",
    type: "string"
  },
  {
    name: "subheadline",
    label: "Subheadline",
    type: "string",
    ui: { component: "textarea" }
  },
  {
    name: "avatarIntroScript",
    label: "Avatar Intro Script",
    type: "string",
    ui: { component: "textarea" }
  },
  {
    name: "avatarIntroEmotion",
    label: "Avatar Intro Emotion",
    type: "string",
    options: voiceEmotionOptions,
    description: "Voice emotion for the intro script"
  },
  {
    name: "primaryButtonText",
    label: "Primary Button Text",
    type: "string"
  },
  {
    name: "primaryButtonAction",
    label: "Button Action",
    type: "string"
  }
];
var questionContentFields = [
  {
    name: "questionText",
    label: "Question Text",
    type: "string",
    ui: { component: "textarea" },
    description: "Supports variables like {previousAnswer}, {keyword}"
  },
  {
    name: "inputType",
    label: "Input Type",
    type: "string",
    options: [
      { value: "radio", label: "Radio Buttons" },
      { value: "dropdown", label: "Dropdown" },
      { value: "checkbox", label: "Checkboxes" },
      { value: "button-group", label: "Button Group" }
    ]
  },
  {
    name: "helperText",
    label: "Helper Text",
    type: "string"
  },
  {
    name: "isRequired",
    label: "Required",
    type: "boolean"
  },
  {
    name: "answerOptions",
    label: "Answer Options",
    type: "object",
    list: true,
    ui: {
      itemProps: (item) => ({
        label: item?.label || "New Option"
      })
    },
    fields: answerOptionFields
  }
];
var avatarContentFields = [
  {
    name: "scriptText",
    label: "Avatar Script",
    type: "string",
    ui: { component: "textarea" },
    description: "What the avatar says. Supports variables."
  },
  {
    name: "emotion",
    label: "Emotion",
    type: "string",
    options: voiceEmotionOptions,
    description: "Voice emotion when speaking this script"
  },
  {
    name: "gestureHint",
    label: "Gesture Hint",
    type: "string"
  },
  {
    name: "pauseAfterMs",
    label: "Pause After (ms)",
    type: "number"
  },
  {
    name: "autoAdvance",
    label: "Auto-Advance",
    type: "boolean"
  },
  {
    name: "autoAdvanceDelayMs",
    label: "Auto-Advance Delay (ms)",
    type: "number"
  }
];
var emailCaptureContentFields = [
  {
    name: "promptText",
    label: "Prompt Text",
    type: "string"
  },
  {
    name: "placeholderText",
    label: "Placeholder",
    type: "string"
  },
  {
    name: "submitButtonText",
    label: "Submit Button Text",
    type: "string"
  },
  {
    name: "avatarResponseOnSubmit",
    label: "Avatar Response",
    type: "string",
    ui: { component: "textarea" }
  },
  {
    name: "avatarEmotionOnSubmit",
    label: "Avatar Emotion (Submit)",
    type: "string",
    options: voiceEmotionOptions,
    description: "Voice emotion when email is submitted"
  },
  {
    name: "skipOptionText",
    label: "Skip Option Text",
    type: "string"
  },
  {
    name: "avatarResponseOnSkip",
    label: "Avatar Response (Skip)",
    type: "string",
    ui: { component: "textarea" }
  },
  {
    name: "avatarEmotionOnSkip",
    label: "Avatar Emotion (Skip)",
    type: "string",
    options: voiceEmotionOptions,
    description: "Voice emotion when email is skipped"
  }
];
var ctaContentFields = [
  {
    name: "headline",
    label: "Headline",
    type: "string"
  },
  {
    name: "bodyText",
    label: "Body Text",
    type: "string",
    ui: { component: "textarea" }
  },
  {
    name: "primaryButtonText",
    label: "Primary Button",
    type: "string"
  },
  {
    name: "primaryButtonUrl",
    label: "Primary Button URL",
    type: "string"
  },
  {
    name: "secondaryButtonText",
    label: "Secondary Button",
    type: "string"
  },
  {
    name: "secondaryButtonUrl",
    label: "Secondary Button URL",
    type: "string"
  }
];
var stepFields = [
  {
    name: "stepId",
    label: "Step ID",
    type: "string",
    required: true
  },
  {
    name: "internalName",
    label: "Internal Name",
    type: "string",
    description: "Admin-friendly name for this step"
  },
  {
    name: "order",
    label: "Order",
    type: "number",
    required: true
  },
  {
    name: "stepType",
    label: "Step Type",
    type: "string",
    options: [
      { value: "header", label: "Header/Intro" },
      { value: "question", label: "Question" },
      { value: "avatar-monologue", label: "Avatar Monologue" },
      { value: "transition", label: "Transition" },
      { value: "email-capture", label: "Email Capture" },
      { value: "cta", label: "Call to Action" },
      { value: "results", label: "Results Summary" }
    ],
    required: true
  },
  {
    name: "headerContent",
    label: "Header Content",
    type: "object",
    fields: headerContentFields
  },
  {
    name: "questionContent",
    label: "Question Content",
    type: "object",
    fields: questionContentFields
  },
  {
    name: "avatarContent",
    label: "Avatar Content",
    type: "object",
    fields: avatarContentFields
  },
  {
    name: "emailCaptureContent",
    label: "Email Capture Content",
    type: "object",
    fields: emailCaptureContentFields
  },
  {
    name: "ctaContent",
    label: "CTA Content",
    type: "object",
    fields: ctaContentFields
  },
  {
    name: "styling",
    label: "Styling Overrides",
    type: "object",
    fields: [
      {
        name: "backgroundColor",
        label: "Background Color",
        type: "string"
      },
      {
        name: "customCssClass",
        label: "Custom CSS Class",
        type: "string"
      }
    ]
  },
  {
    name: "analytics",
    label: "Analytics",
    type: "object",
    fields: [
      {
        name: "trackingEventName",
        label: "Tracking Event Name",
        type: "string"
      },
      {
        name: "customProperties",
        label: "Custom Properties",
        type: "string",
        ui: { component: "textarea" }
      }
    ]
  }
];
var flowsCollection = {
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
      description: "Unique identifier for this flow"
    },
    {
      name: "displayName",
      label: "Display Name",
      type: "string",
      required: true
    },
    {
      name: "description",
      label: "Description",
      type: "string",
      ui: { component: "textarea" }
    },
    {
      name: "isActive",
      label: "Active",
      type: "boolean"
    },
    {
      name: "introVideo",
      label: "Intro Video",
      type: "image",
      description: "Background video shown on the intro screen"
    },
    {
      name: "globalVariables",
      label: "Global Variables",
      type: "object",
      fields: [
        {
          name: "avatarName",
          label: "Avatar Name",
          type: "string"
        },
        {
          name: "brandName",
          label: "Brand Name",
          type: "string"
        },
        {
          name: "supportEmail",
          label: "Support Email",
          type: "string"
        },
        {
          name: "customVar1",
          label: "Custom Variable 1",
          type: "string"
        },
        {
          name: "customVar2",
          label: "Custom Variable 2",
          type: "string"
        }
      ]
    },
    {
      name: "steps",
      label: "Steps",
      type: "object",
      list: true,
      ui: {
        itemProps: (item) => ({
          label: `Step ${item?.order || "?"}: ${item?.internalName || item?.stepType || "Untitled"}`
        }),
        defaultItem: {
          order: 1,
          stepType: "question"
        }
      },
      fields: stepFields
    },
    {
      name: "metadata",
      label: "Metadata",
      type: "object",
      fields: [
        {
          name: "createdAt",
          label: "Created",
          type: "datetime"
        },
        {
          name: "updatedAt",
          label: "Last Updated",
          type: "datetime"
        },
        {
          name: "author",
          label: "Author",
          type: "string"
        },
        {
          name: "version",
          label: "Version",
          type: "string"
        }
      ]
    }
  ],
  ui: {
    filename: {
      readonly: true,
      slugify: (values) => values?.flowId || "new-flow"
    }
  }
};

// tina/config.ts
var isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";
var config_default = defineConfig({
  // For local development, use the local content API
  // For production, requires TinaCloud configuration
  contentApiUrlOverride: isLocal ? "/api/tina/gql" : void 0,
  branch: process.env.TINA_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || process.env.HEAD || "main",
  // TinaCloud credentials (required for production, optional for local dev)
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID || "",
  token: process.env.TINA_TOKEN || "",
  build: {
    outputFolder: "admin",
    publicFolder: "public"
  },
  media: {
    tina: {
      mediaRoot: "uploads",
      publicFolder: "public"
    }
  },
  schema: {
    collections: [
      stepTypesCollection,
      inputTypesCollection,
      flowsCollection
    ]
  }
});
export {
  config_default as default
};
