// Centralized flow registry
// Both page.tsx and DevPanel pull from this single source

import backPainFlow from "../../content/flows/back-pain-flow.json";
// Other flows temporarily disabled until back-pain is fully working
// import achesAndPainsFlow from "../../content/flows/achesandpains-flow.json";
// import headacheFlow from "../../content/flows/wakeupwithaheadache-flow.json";
// import hipPainFlow from "../../content/flows/hippain-flow.json";
// import feelingTiredFlow from "../../content/flows/wakeupfeelingtired-flow.json";
// import neckPainFlow from "../../content/flows/neckpain-flow.json";
// import shoulderPainFlow from "../../content/flows/shoulderpain-flow.json";

export interface FlowConfig {
  id: string;
  label: string;
  // eslint-disable-next-line
  data: any;
}

// Master list of available flows
export const FLOW_REGISTRY: FlowConfig[] = [
  { id: 'default', label: 'Back Pain (Default)', data: backPainFlow },
  { id: 'back-pain', label: 'Back Pain', data: backPainFlow },
  // Uncomment these when ready:
  // { id: 'achesandpains', label: 'Aches & Pains', data: achesAndPainsFlow },
  // { id: 'wakeupwithaheadache', label: 'Headache', data: headacheFlow },
  // { id: 'hippain', label: 'Hip Pain', data: hipPainFlow },
  // { id: 'wakeupfeelingtired', label: 'Feeling Tired', data: feelingTiredFlow },
  // { id: 'neckpain', label: 'Neck Pain', data: neckPainFlow },
  // { id: 'shoulderpain', label: 'Shoulder Pain', data: shoulderPainFlow },
];

// Map for quick lookup by ID (used by page.tsx)
// eslint-disable-next-line
export const FLOWS: Record<string, any> = Object.fromEntries(
  FLOW_REGISTRY.map(flow => [flow.id, flow.data])
);

// List for UI display (used by DevPanel)
export const AVAILABLE_FLOWS = FLOW_REGISTRY
  .filter(flow => flow.id !== 'back-pain') // Exclude duplicate, keep 'default'
  .map(flow => ({ id: flow.id, label: flow.label }));

// Get flow by ID with fallback to default
// eslint-disable-next-line
export function getFlow(flowId: string): any {
  return FLOWS[flowId] || FLOWS['default'];
}
