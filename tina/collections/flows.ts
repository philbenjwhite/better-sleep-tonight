import { Collection, TinaField, Template } from "tinacms";

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

// Intro screen fields (shown before steps begin)
const introScreenFields: TinaField[] = [
  {
    name: "avatarImage",
    label: "Avatar Image",
    type: "image",
    description: "Avatar image displayed on the intro screen",
  },
  {
    name: "backgroundVideo",
    label: "Background Video",
    type: "image",
    description: "Background video that plays on the intro screen",
  },
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

// Common step fields shared by all step types
const commonStepFields: TinaField[] = [
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
];

// Step Templates - each type has its own fields
const videoStepTemplate: Template = {
  name: "videoStep",
  label: "Video",
  fields: [
    ...commonStepFields,
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
  ],
};

const questionStepTemplate: Template = {
  name: "questionStep",
  label: "Question",
  fields: [
    ...commonStepFields,
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
  ],
};

const emailCaptureStepTemplate: Template = {
  name: "emailCaptureStep",
  label: "Email Capture",
  fields: [
    ...commonStepFields,
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
  ],
};

const seeOptionsStepTemplate: Template = {
  name: "seeOptionsStep",
  label: "See Options Prompt",
  fields: [
    ...commonStepFields,
    {
      name: "promptText",
      label: "Prompt Text",
      type: "string",
    },
    {
      name: "buttonText",
      label: "Button Text",
      type: "string",
    },
    {
      name: "avatarMessage",
      label: "Avatar Message",
      type: "string",
      ui: { component: "textarea" },
    },
    {
      name: "avatarEmotion",
      label: "Avatar Emotion",
      type: "string",
      options: voiceEmotionOptions,
    },
  ],
};

const productRecommendationsStepTemplate: Template = {
  name: "productRecommendationsStep",
  label: "Product Recommendations",
  fields: [
    ...commonStepFields,
    {
      name: "headline",
      label: "Headline",
      type: "string",
    },
    {
      name: "avatarResponse",
      label: "Avatar Response",
      type: "string",
      ui: { component: "textarea" },
      description: "What the avatar says after selection",
    },
    {
      name: "avatarEmotion",
      label: "Avatar Emotion",
      type: "string",
      options: voiceEmotionOptions,
    },
  ],
};

const zipcodeCaptureStepTemplate: Template = {
  name: "zipcodeCaptureStep",
  label: "Zip Code Capture",
  fields: [
    ...commonStepFields,
    {
      name: "headline",
      label: "Headline",
      type: "string",
    },
    {
      name: "placeholderText",
      label: "Placeholder Text",
      type: "string",
    },
    {
      name: "buttonText",
      label: "Button Text",
      type: "string",
    },
  ],
};

const storeLocationsStepTemplate: Template = {
  name: "storeLocationsStep",
  label: "Store Locations",
  fields: [
    ...commonStepFields,
    {
      name: "headerText",
      label: "Header Text",
      type: "string",
    },
    {
      name: "defaultPostalCode",
      label: "Default Postal Code",
      type: "string",
    },
    {
      name: "ctaBookTitle",
      label: "Book CTA Title",
      type: "string",
    },
    {
      name: "ctaBookDescription",
      label: "Book CTA Description",
      type: "string",
      ui: { component: "textarea" },
    },
    {
      name: "ctaBookButtonText",
      label: "Book CTA Button Text",
      type: "string",
    },
    {
      name: "ctaContactTitle",
      label: "Contact CTA Title",
      type: "string",
    },
    {
      name: "ctaContactDescription",
      label: "Contact CTA Description",
      type: "string",
      ui: { component: "textarea" },
    },
    {
      name: "ctaContactButtonText",
      label: "Contact CTA Button Text",
      type: "string",
    },
  ],
};

const ctaStepTemplate: Template = {
  name: "ctaStep",
  label: "Call to Action",
  fields: [
    ...commonStepFields,
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
  ],
};

const resultsStepTemplate: Template = {
  name: "resultsStep",
  label: "Results Summary",
  fields: [
    ...commonStepFields,
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
  ],
};

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
      name: "introScreen",
      label: "Intro Screen",
      type: "object",
      description: "The welcome screen shown before steps begin",
      fields: introScreenFields,
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
      templates: [
        videoStepTemplate,
        questionStepTemplate,
        emailCaptureStepTemplate,
        seeOptionsStepTemplate,
        productRecommendationsStepTemplate,
        zipcodeCaptureStepTemplate,
        storeLocationsStepTemplate,
        ctaStepTemplate,
        resultsStepTemplate,
      ],
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
