import { Collection } from "tinacms";

export const stepTypesCollection: Collection = {
  name: "stepTypes",
  label: "Step Types",
  path: "content/stepTypes",
  format: "json",
  fields: [
    {
      name: "slug",
      label: "Slug",
      type: "string",
      required: true,
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
    },
    {
      name: "icon",
      label: "Admin Icon",
      type: "string",
      description: "Icon name for admin UI",
    },
    {
      name: "requiresUserInput",
      label: "Requires User Input",
      type: "boolean",
    },
    {
      name: "hasAvatarResponse",
      label: "Has Avatar Response",
      type: "boolean",
    },
  ],
  ui: {
    filename: {
      readonly: true,
      slugify: (values) => values?.slug || "new-step-type",
    },
  },
};
