import { defineConfig } from "tinacms";

import { stepTypesCollection } from "./collections/stepTypes";
import { inputTypesCollection } from "./collections/inputTypes";
import { flowsCollection } from "./collections/flows";

// Check if we're in local development mode
const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";

export default defineConfig({
  // For local development, use the local content API
  // For production, requires TinaCloud configuration
  contentApiUrlOverride: isLocal ? "/api/tina/gql" : undefined,

  branch:
    process.env.TINA_BRANCH ||
    process.env.VERCEL_GIT_COMMIT_REF ||
    process.env.HEAD ||
    "main",

  // TinaCloud credentials (required for production, optional for local dev)
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID || "",
  token: process.env.TINA_TOKEN || "",

  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },

  media: {
    tina: {
      mediaRoot: "uploads",
      publicFolder: "public",
    },
  },

  schema: {
    collections: [
      stepTypesCollection,
      inputTypesCollection,
      flowsCollection,
    ],
  },
});
