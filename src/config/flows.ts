// Centralized flow registry
// Single primary flow — the ?flow= parameter only changes the intro headline

// eslint-disable-next-line
import primaryFlow from "../../content/flows/primary-flow.json";

export interface FlowConfig {
  id: string;
  label: string;
  // eslint-disable-next-line
  data: any;
}

// Condition phrases per flow parameter
// Used to build both the headline and the subheadline dynamically
export const FLOW_CONDITIONS: Record<string, { headline: string; subheadlinePhrase: string }> = {
  'default':              { headline: 'Waking up with back pain? Get Better Sleep Tonight!',          subheadlinePhrase: 'back pain' },
  'back-pain':            { headline: 'Waking up with back pain? Get Better Sleep Tonight!',          subheadlinePhrase: 'back pain' },
  'achesandpains':        { headline: 'Waking up with aches and pains? Get Better Sleep Tonight!',    subheadlinePhrase: 'aches and pains' },
  'wakeupwithaheadache':  { headline: 'Waking up with a headache? Get Better Sleep Tonight!',         subheadlinePhrase: 'a headache' },
  'hippain':              { headline: 'Waking up with hip pain? Get Better Sleep Tonight!',           subheadlinePhrase: 'hip pain' },
  'wakeupfeelingtired':   { headline: 'Waking up feeling tired? Get Better Sleep Tonight!',           subheadlinePhrase: 'feeling tired' },
  'neckpain':             { headline: 'Waking up with neck pain? Get Better Sleep Tonight!',          subheadlinePhrase: 'neck pain' },
  'shoulderpain':         { headline: 'Waking up with shoulder pain? Get Better Sleep Tonight!',      subheadlinePhrase: 'shoulder pain' },
};

// Legacy alias used by config/index.ts
export const FLOW_HEADLINES: Record<string, string> = Object.fromEntries(
  Object.entries(FLOW_CONDITIONS).map(([id, { headline }]) => [id, headline])
);

// All flow param values resolve to the same primary flow data
const FLOW_IDS = Object.keys(FLOW_HEADLINES);

// Master list of available flows (for DevPanel display)
export const FLOW_REGISTRY: FlowConfig[] = FLOW_IDS.map(id => ({
  id,
  label: id === 'default' ? 'Back Pain (Default)' : FLOW_HEADLINES[id],
  data: primaryFlow,
}));

// Map for quick lookup by ID (used by page.tsx)
// eslint-disable-next-line
export const FLOWS: Record<string, any> = Object.fromEntries(
  FLOW_REGISTRY.map(flow => [flow.id, flow.data])
);

// List for UI display (used by DevPanel)
export const AVAILABLE_FLOWS = FLOW_REGISTRY
  .filter(flow => flow.id !== 'back-pain') // Exclude duplicate of default
  .map(flow => ({ id: flow.id, label: flow.label }));

// Get flow by ID with fallback to default
// eslint-disable-next-line
export function getFlow(flowId: string): any {
  return FLOWS[flowId] || FLOWS['default'];
}

// Get headline for a flow parameter, with fallback to default
export function getFlowHeadline(flowId: string): string {
  return (FLOW_CONDITIONS[flowId] || FLOW_CONDITIONS['default']).headline;
}

// Get the subheadline with the condition phrase swapped in
// Replaces "back pain" in the CMS subheadline with the flow-specific phrase
export function getFlowSubheadline(flowId: string, baseSubheadline: string): string {
  const { subheadlinePhrase } = FLOW_CONDITIONS[flowId] || FLOW_CONDITIONS['default'];
  return baseSubheadline.replace('back pain', subheadlinePhrase);
}
