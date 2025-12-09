# CMS Update Proposal for New Content Flows

## Executive Summary

After reviewing all 7 PDF content flows and the current TinaCMS schema, I've identified that:

1. **All 7 flows share identical questions** - only the intro content (headline, subheadline) differs based on the condition
2. **The current CMS already supports most requirements** - no major schema changes needed
3. **Some step types are unused** for these flows and can be marked as optional
4. **Skip logic needs enhancement** - the PDFs require terminating flows based on specific answer combinations

---

## Current Step Types vs. PDF Requirements

| Step Type | Currently Exists | Required by PDFs | Action |
|-----------|------------------|------------------|--------|
| `header` | ✅ | ✅ Homepage Landing + Opening Script | **Keep** |
| `question` | ✅ | ✅ 5 questions per flow | **Keep** |
| `avatar-monologue` | ✅ | ✅ Analysis/Recommendation scripts | **Keep** |
| `cta` | ✅ | ✅ Product recommendations | **Keep** |
| `email-capture` | ✅ | ✅ Close-out section | **Keep** |
| `transition` | ✅ | ❌ Not used | **Optional** - keep but deprioritize |
| `results` | ✅ | ❌ Not used | **Optional** - keep but deprioritize |

**Recommendation:** Keep all step types but mark `transition` and `results` as "advanced/optional" in the CMS UI.

---

## The 5 Standard Questions (Shared Across All Flows)

### Q1: Trouble Falling Asleep

```json
{
  "stepId": "q1-trouble-falling-asleep",
  "questionText": "How often do you have trouble falling asleep?",
  "inputType": "radio",
  "answerOptions": [
    { "label": "Every Night", "value": "every-night", "tags": ["severe"] },
    { "label": "Frequently", "value": "frequently", "tags": ["moderate"] },
    { "label": "On Occasion", "value": "on-occasion", "tags": ["occasional"] },
    { "label": "Never", "value": "never", "tags": ["no-issues"], "terminateFlow": true }
  ]
}
```

### Q2: Sleep Position

```json
{
  "stepId": "q2-sleep-position",
  "questionText": "Which position do you sleep in the most?",
  "inputType": "radio",
  "answerOptions": [
    { "label": "On My Side", "value": "side", "tags": ["side-sleeper"] },
    { "label": "On My Back", "value": "back", "tags": ["back-sleeper"] },
    { "label": "On My Stomach", "value": "stomach", "tags": ["stomach-sleeper"] },
    { "label": "It Varies", "value": "varies", "tags": ["combination-sleeper"] }
  ]
}
```

### Q3: Motion/Tossing & Turning

```json
{
  "stepId": "q3-motion-disturbance",
  "questionText": "How often does motion or tossing and turning in bed wake you up or prevent you from falling asleep?",
  "inputType": "radio",
  "answerOptions": [
    { "label": "Never", "value": "never", "tags": ["no-motion-issues"] },
    { "label": "Occasionally", "value": "occasionally", "tags": ["mild-motion"] },
    { "label": "Regularly", "value": "regularly", "tags": ["motion-issues"] },
    { "label": "I'm Not Sure", "value": "not-sure", "tags": ["unknown"] }
  ]
}
```

### Q4: Aches and Pains Frequency

```json
{
  "stepId": "q4-aches-pains-frequency",
  "questionText": "How often do you wake with aches and pains?",
  "inputType": "radio",
  "answerOptions": [
    { "label": "Every Night", "value": "every-night", "tags": ["severe-pain"] },
    { "label": "Frequently", "value": "frequently", "tags": ["moderate-pain"] },
    { "label": "On Occasion", "value": "on-occasion", "tags": ["occasional-pain"] },
    { "label": "Never", "value": "never", "tags": ["no-pain"], "terminateFlow": true }
  ]
}
```

### Q5: Aches & Pains Type

```json
{
  "stepId": "q5-aches-pains-type",
  "questionText": "Which of the following is most true for your aches & pains",
  "inputType": "radio",
  "answerOptions": [
    { "label": "Spinal surgery, chronic condition, or bad injury", "value": "chronic-condition", "tags": ["medical"] },
    { "label": "Stiffness or Soreness", "value": "stiffness", "tags": ["stiffness"] },
    { "label": "Hip or Shoulder Discomfort", "value": "hip-shoulder", "tags": ["pressure-points"] },
    { "label": "None of the above", "value": "none", "tags": ["other"], "terminateFlow": true }
  ]
}
```

---

## Required Schema Enhancements

### 1. Add `terminateFlow` Flag to Answer Options

**Current:** `answerOptionFields` in `tina/collections/flows.ts` has `nextStepOverride` for branching

**Proposed Addition:**

```typescript
{
  name: "terminateFlow",
  label: "Terminate Flow",
  type: "boolean",
  description: "End the flow with a termination message if this option is selected"
},
{
  name: "terminationMessage",
  label: "Termination Message",
  type: "string",
  ui: { component: "textarea" },
  description: "Message shown when flow is terminated (avatar script)"
}
```

This enables the skip logic from the PDFs: *"If user selects 1d, 4d, 5d then terminate with message"*

### 2. Add Flow-Level `keyword` Variable

**Current:** `globalVariables` in `tina/collections/flows.ts` has generic custom variables

**Proposed Addition:**

```typescript
{
  name: "conditionKeyword",
  label: "Condition Keyword",
  type: "string",
  description: "The main condition/pain point (e.g., 'back pain', 'headaches')"
}
```

This allows dynamic text like: *"I know how frustrating {keyword} can be"*

### 3. Add `secondaryScript` and `tertiaryScript` to Avatar Content

**Current:** `avatarContentFields` in `tina/collections/flows.ts` has single `scriptText`

**Proposed Addition:**

```typescript
{
  name: "secondaryScriptText",
  label: "Secondary Script",
  type: "string",
  ui: { component: "textarea" }
},
{
  name: "tertiaryScriptText",
  label: "Tertiary Script",
  type: "string",
  ui: { component: "textarea" }
}
```

The PDFs show Analysis steps with multiple script sections.

### 4. Enhance Header Content for Homepage Landing

**Current:** `headerContentFields` in `tina/collections/flows.ts` covers most needs

**Proposed Addition:**

```typescript
{
  name: "audioNotice",
  label: "Audio Notice",
  type: "string",
  description: "Notice about audio/volume requirements"
},
{
  name: "secondarySubheadline",
  label: "Secondary Subheadline",
  type: "string",
  ui: { component: "textarea" }
}
```

---

## Flow-Specific Content (What Differs Per Flow)

Only these fields need customization per flow:

| Field | Example (Back Pain) | Example (Headache) |
|-------|---------------------|-------------------|
| `flowId` | `back-pain` | `wakeupwithaheadache` |
| `conditionKeyword` | `back pain` | `headaches` |
| `headline` | "Wake Up Without Back Pain" | "Stop Waking Up with Headaches" |
| `subheadline` | "Back pain making mornings miserable?..." | "Tired of headaches ruining your day?..." |
| `avatarIntroScript` | "I know how frustrating back pain can be..." | "I know how frustrating headaches can be..." |

---

## Summary of Changes

| Change | Type | Priority |
|--------|------|----------|
| Add `terminateFlow` to answer options | Schema addition | **High** (required for skip logic) |
| Add `terminationMessage` to answer options | Schema addition | **High** |
| Add `conditionKeyword` to globalVariables | Schema addition | Medium |
| Add `secondaryScriptText`/`tertiaryScriptText` | Schema addition | Medium |
| Add `audioNotice` to header | Schema addition | Low |
| Mark `transition`/`results` as optional | UI change only | Low |

---

## Implementation Plan

1. **Phase 1:** Update TinaCMS schema with new fields
2. **Phase 2:** Create the 7 flow JSON files using the standardized questions
3. **Phase 3:** Implement frontend skip logic to handle `terminateFlow` flag
4. **Phase 4:** Test all flows end-to-end

---

## Flows to Create

Based on the PDF documents:

| Flow ID | URL Parameter | Condition |
|---------|---------------|-----------|
| `achesandpains` | `/?flow=achesandpains` | Aches & Pains |
| `wakeupwithaheadache` | `/?flow=wakeupwithaheadache` | Headache |
| `hippain` | `/?flow=hippain` | Hip Pain |
| `back-pain` | `/?flow=back-pain` | Back Pain |
| `wakeupfeelingtired` | `/?flow=wakeupfeelingtired` | Feeling Tired |
| `neckpain` | `/?flow=neckpain` | Neck Pain |
| `shoulderpain` | `/?flow=shoulderpain` | Shoulder Pain |
