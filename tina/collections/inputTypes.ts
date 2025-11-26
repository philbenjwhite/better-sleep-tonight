import { Collection } from "tinacms";

export const inputTypesCollection: Collection = {
  name: "inputTypes",
  label: "Input Types",
  path: "content/inputTypes",
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
      name: "allowsMultiple",
      label: "Allows Multiple Selection",
      type: "boolean",
    },
    {
      name: "hasOptions",
      label: "Has Predefined Options",
      type: "boolean",
      description: "Whether this type uses answer options (vs free text)",
    },
    {
      name: "validationPattern",
      label: "Validation Regex",
      type: "string",
      description: "Optional regex for validation",
    },
  ],
  ui: {
    filename: {
      readonly: true,
      slugify: (values) => values?.slug || "new-input-type",
    },
  },
};
