# Sleep Diagnosis Flow - Technical Reference

This is the technical companion to the content document. It maps the content structure to the TinaCMS collections and fields.

---

## TinaCMS Collection: `flows`

**Path:** `content/flows/`
**Format:** JSON

### Flow-Level Fields

| Field | Type | Description |
|-------|------|-------------|
| `flowId` | string (required) | Unique identifier, e.g., `wake-up-rested` |
| `displayName` | string (required) | Human-readable name |
| `keyword` | reference | Links to `keywords` collection |
| `description` | textarea | Internal description |
| `isActive` | boolean | Enable/disable the flow |
| `globalVariables` | object | See below |
| `steps` | object[] | Array of step objects |
| `metadata` | object | createdAt, updatedAt, author, version |

### Global Variables Object

| Field | Type |
|-------|------|
| `avatarName` | string |
| `brandName` | string |
| `supportEmail` | string |
| `customVar1` | string |
| `customVar2` | string |

---

## Step Object Structure

Each item in the `steps` array has these fields:

| Field | Type | Description |
|-------|------|-------------|
| `stepId` | string (required) | Unique ID for this step |
| `internalName` | string | Admin-friendly label |
| `order` | number (required) | Sequence position |
| `stepType` | enum (required) | See step types below |
| `headerContent` | object | For `header` step type |
| `questionContent` | object | For `question` step type |
| `avatarContent` | object | For `avatar-monologue` / `transition` types |
| `emailCaptureContent` | object | For `email-capture` step type |
| `ctaContent` | object | For `cta` step type |
| `styling` | object | backgroundColor, customCssClass |
| `analytics` | object | trackingEventName, customProperties |

### Step Types (enum)

- `header` - Opening/intro screen (homepage landing)
- `question` - User input step
- `avatar-monologue` - Avatar speaks, no user input
- `transition` - Brief transition moment
- `email-capture` - Email collection
- `cta` - Call to action / final screen
- `results` - Results summary

---

## Content Type: Header (`headerContent`)

*Maps to: Homepage Landing Screen + Opening Script*

This is what users see when they first land on the page, before the avatar video starts.

| Field | Type | Content Doc Location |
|-------|------|---------------------|
| `headline` | string | "Find Your Perfect Mattress" - Big text at top |
| `subheadline` | textarea | "Hey, I'm Ashley..." - Main intro paragraph |
| `subheadlineSecondary` | textarea | "The good news?..." - Second paragraph (optional) |
| `avatarIntroScript` | textarea | What the avatar says AFTER user clicks button |
| `primaryButtonText` | string | "Let's Begin" - Button text |
| `primaryButtonAction` | string | Usually `next` |
| `audioNotice` | string | "For best experience..." - Small text above button |

### Example from CMS:

```json
"headerContent": {
  "headline": "Find Your Perfect Mattress",
  "subheadline": "Hey, I'm Ashley — your virtual sleep guide. My job is simple: helping you wake up clear, refreshed, and pain‑free. If sleep hasn't been treating you right, you're not alone.",
  "subheadlineSecondary": "The good news? You're in the right place to fix it.",
  "avatarIntroScript": "A lot of people struggle with restless nights, sore mornings, and that 'why do I feel 20 years older?' stiffness...",
  "primaryButtonText": "Let's Begin",
  "primaryButtonAction": "next",
  "audioNotice": "For best experience please have your audio turned on"
}
```

---

## Content Type: Question (`questionContent`)

*Maps to: Question sections*

| Field | Type | Content Doc Location |
|-------|------|---------------------|
| `questionText` | textarea | "What the avatar asks" |
| `inputType` | enum | `radio`, `dropdown`, `checkbox`, `button-group`, `text` |
| `inputSubtype` | string | For text inputs: `number`, `email`, etc. |
| `placeholder` | string | Placeholder text in input field |
| `helperText` | string | Helper text below input |
| `isRequired` | boolean | Whether answer is required |
| `answerOptions` | object[] | Array of answer option objects (for radio/button types) |
| `avatarResponse` | textarea | Avatar response for text inputs (no options) |
| `validation` | object | min, max, errorMessage (for number inputs) |

### Answer Option Object

*Maps to: Answer Options table rows*

| Field | Type | Content Doc Location |
|-------|------|---------------------|
| `optionId` | string (required) | Internal ID (e.g., `q1-opt1`) |
| `label` | string (required) | "Button Text" column |
| `value` | string (required) | Value stored when selected |
| `order` | number | Display order |
| `avatarResponse` | textarea | "What the avatar says after they pick this" column |
| `avatarEmotion` | enum | `neutral`, `empathetic`, `encouraging`, `curious`, `concerned`, `excited` |
| `nextStepOverride` | string | Step ID to jump to (for branching) |
| `nextStepType` | string | Step type to jump to |
| `tags` | string[] | For analytics |

### Example from CMS:

```json
"questionContent": {
  "questionText": "Who is this bed for?",
  "inputType": "radio",
  "isRequired": true,
  "answerOptions": [
    {
      "optionId": "q1-opt1",
      "label": "Me",
      "value": "me",
      "order": 1,
      "avatarResponse": "What is your age?",
      "avatarEmotion": "curious",
      "tags": ["single-user"]
    }
  ]
}
```

---

## Content Type: Avatar Monologue (`avatarContent`)

*Maps to: Closing Script section*

| Field | Type | Content Doc Location |
|-------|------|---------------------|
| `scriptText` | textarea | "What the avatar says before showing the recommendation" |
| `emotion` | enum | `neutral`, `empathetic`, `encouraging`, `curious`, `excited` |
| `gestureHint` | string | Optional gesture instruction |
| `pauseAfterMs` | number | Milliseconds to pause |
| `autoAdvance` | boolean | Auto-proceed to next step |
| `autoAdvanceDelayMs` | number | Delay before auto-advance |

### Example from CMS:

```json
"avatarContent": {
  "scriptText": "From what you told me, it sounds like your biggest sleep disruptors are...",
  "emotion": "encouraging",
  "autoAdvance": false
}
```

---

## Content Type: CTA (`ctaContent`)

*Maps to: Final recommendation screen*

| Field | Type | Content Doc Location |
|-------|------|-------------|
| `headline` | string | "Your Personalized Sleep Solutions" |
| `bodyText` | textarea | "Based on your sleep profile..." |
| `primaryButtonText` | string | "View My Recommendations" |
| `primaryButtonUrl` | string | `/recommendations` |
| `secondaryButtonText` | string | "Talk to a Sleep Expert" |
| `secondaryButtonUrl` | string | `/contact` |

### Example from CMS:

```json
"ctaContent": {
  "headline": "Your Personalized Sleep Solutions",
  "bodyText": "Based on your sleep profile, I've selected Tempur-Pedic mattresses specifically designed to address YOUR needs.",
  "primaryButtonText": "View My Recommendations",
  "primaryButtonUrl": "/recommendations",
  "secondaryButtonText": "Talk to a Sleep Expert",
  "secondaryButtonUrl": "/contact"
}
```

---

## Content Type: Email Capture (`emailCaptureContent`)

| Field | Type | Description |
|-------|------|-------------|
| `promptText` | string | "Enter your email" text |
| `placeholderText` | string | Input placeholder |
| `submitButtonText` | string | Submit button label |
| `avatarResponseOnSubmit` | textarea | What avatar says on submit |
| `skipOptionText` | string | Skip link text |
| `avatarResponseOnSkip` | textarea | What avatar says on skip |

---

## Variable Substitution

These variables can be used in any text field:

| Variable | Source |
|----------|--------|
| `{previousAnswer}` | User's answer from previous step |
| `{thisAnswer}` | Current answer being submitted |
| `{keyword}` | Flow's trigger keyword |
| `{avatarName}` | From globalVariables |
| `{brandName}` | From globalVariables |

---

## Full Example JSON Structure

```json
{
  "flowId": "sleep-diagnosis-flow",
  "displayName": "Sleep Diagnosis Journey",
  "keyword": "content/keywords/sleep-diagnosis.json",
  "isActive": true,
  "globalVariables": {
    "avatarName": "Ashley",
    "brandName": "Better Sleep Tonight"
  },
  "steps": [
    {
      "stepId": "intro-step",
      "internalName": "Welcome & Introduction",
      "order": 1,
      "stepType": "header",
      "headerContent": {
        "headline": "Find Your Perfect Mattress",
        "subheadline": "Hey, I'm Ashley — your virtual sleep guide...",
        "subheadlineSecondary": "The good news? You're in the right place to fix it.",
        "avatarIntroScript": "A lot of people struggle with restless nights...",
        "primaryButtonText": "Let's Begin",
        "primaryButtonAction": "next",
        "audioNotice": "For best experience please have your audio turned on"
      }
    },
    {
      "stepId": "q1-who-is-bed-for",
      "internalName": "Who is bed for",
      "order": 2,
      "stepType": "question",
      "questionContent": {
        "questionText": "Who is this bed for?",
        "inputType": "radio",
        "isRequired": true,
        "answerOptions": [
          {
            "optionId": "q1-opt1",
            "label": "Me",
            "value": "me",
            "avatarResponse": "What is your age?",
            "avatarEmotion": "curious"
          }
        ]
      }
    }
  ]
}
```

---

## Related Collections

### `keywords` Collection

**Path:** `content/keywords/`

| Field | Type |
|-------|------|
| `slug` | string |
| `displayName` | string |
| `description` | string |

### `stepTypes` Collection

**Path:** `content/stepTypes/`

| Field | Type |
|-------|------|
| `slug` | string |
| `displayName` | string |
| `description` | string |
| `icon` | string |
| `requiresUserInput` | boolean |
| `hasAvatarResponse` | boolean |

### `inputTypes` Collection

**Path:** `content/inputTypes/`

| Field | Type |
|-------|------|
| `slug` | string |
| `displayName` | string |
| `description` | string |
| `allowsMultiple` | boolean |
| `hasOptions` | boolean |
| `validationPattern` | string |

---

*Last updated: December 2, 2024*
