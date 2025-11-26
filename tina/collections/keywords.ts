import { Collection } from "tinacms";

export const keywordsCollection: Collection = {
  name: "keywords",
  label: "Keywords",
  path: "content/keywords",
  format: "json",
  fields: [
    {
      name: "slug",
      label: "Slug",
      type: "string",
      required: true,
      description: "URL-safe identifier (e.g., 'back-pain')",
    },
    {
      name: "displayName",
      label: "Display Name",
      type: "string",
      required: true,
      description: "Human-readable name (e.g., 'Back Pain')",
    },
    {
      name: "searchTerms",
      label: "Search Term Variations",
      type: "string",
      list: true,
      description: "Alternative phrases that trigger this flow",
    },
    {
      name: "category",
      label: "Category",
      type: "string",
      options: [
        { value: "pain", label: "Pain" },
        { value: "sleep", label: "Sleep" },
        { value: "wellness", label: "Wellness" },
        { value: "general", label: "General" },
      ],
    },
    {
      name: "isActive",
      label: "Active",
      type: "boolean",
      description: "Enable/disable this keyword flow",
    },
  ],
  ui: {
    filename: {
      readonly: true,
      slugify: (values) => values?.slug || "new-keyword",
    },
  },
};
