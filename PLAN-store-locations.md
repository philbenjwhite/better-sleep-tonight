# Implementation Plan: Store Locations Step

## Overview
Add a final step to the flow that displays nearby store locations where users can test mattresses in person.

---

## What the User Sees

### Header
- Title: "Select your preferred location near L7M 4X7"

### Two-Column Layout

**Left Column - Scrollable Location List:**
Each location card shows:
- City name (bold) - e.g., "Burlington"
- Store name - e.g., "Windsor Ashley HomeStore"
- Distance - e.g., "0.03 km away"
- Action links: `Website` | `Get Directions` | `Call` (in brand maroon color)

**Right Column - Sidebar:**
1. Map image (static placeholder)
2. Store logo (Ashley HomeStore)
3. CTA Section 1:
   - "Prefer to test the mattress in person?"
   - "You can book a sleep-test appointment right away."
   - [Book a Rest Test] button
4. CTA Section 2:
   - "Still unsure and want to talk more?"
   - "I can connect you with a real human sleep specialist anytime."
   - [Contact Us] button

---

## Files to Create

### 1. `src/components/StoreLocations/StoreLocations.tsx`
Main React component with:
- Props interface for content configuration
- Hardcoded sample locations (9 stores from Figma)
- Location card sub-component
- Sidebar with CTAs

### 2. `src/components/StoreLocations/StoreLocations.module.css`
CSS Module with:
- Two-column layout (locations list + sidebar)
- Location card styling with border
- Custom scrollbar for locations list
- Action link styling (maroon color, pipe separators)
- CTA button styling (matching existing brand buttons)
- Responsive breakpoints for mobile

### 3. `src/components/StoreLocations/index.ts`
Barrel export file

---

## Files to Modify

### 4. `content/flows/back-pain-flow.json`
Add new step at the end:
```json
{
  "stepId": "store-locations-step",
  "internalName": "Store Locations",
  "order": 11,
  "stepType": "store-locations",
  "storeLocationsContent": {
    "headerText": "Select your preferred location near",
    "postalCode": "L7M 4X7",
    "ctaBookTitle": "Prefer to test the mattress in person?",
    "ctaBookDescription": "You can book a sleep-test appointment right away.",
    "ctaBookButtonText": "Book a Rest Test",
    "ctaContactTitle": "Still unsure and want to talk more?",
    "ctaContactDescription": "I can connect you with a real human sleep specialist anytime.",
    "ctaContactButtonText": "Contact Us"
  }
}
```

### 5. `src/app/page.tsx`
- Add `StoreLocations` import
- Add `StoreLocationsContent` type interface
- Add `storeLocationsContent` to `FlowStep` type
- Add `store-locations` to step filter
- Add `isStoreLocationsStep` check
- Add JSX to render StoreLocations component

---

## Sample Location Data (Hardcoded)

| City | Store | Distance |
|------|-------|----------|
| Burlington | Windsor Ashley HomeStore | 0.03 km |
| Stoney Creek | Windsor Ashley HomeStore | 23.4 km |
| Brampton | Windsor Ashley HomeStore | 55 km |
| Guelph | Windsor Ashley HomeStore | 54.8 km |
| Toronto | Windsor Ashley HomeStore | 66.4 km |
| Mississauga (Mavis) | Windsor Ashley HomeStore | 79.1 km |
| Mississauga (Matheson) | Windsor Ashley HomeStore | 130 km |
| Woodbridge | Windsor Ashley HomeStore | 238 km |
| Windsor | Windsor Ashley HomeStore | 2 km |

---

## Flow Position

```
Current Flow:
1. intro-step (header)
2. q1-trouble-falling-asleep (question)
3. q2-sleep-position (question)
4. q3-motion-disturbance (question)
5. q4-aches-pains-frequency (question)
6. q5-aches-pains-type (question)
7. answer-summary-step (answer-summary)
8. email-capture (email-capture)
9. see-options-step (see-options)
10. product-recommendations-step (product-recommendations)
11. store-locations-step (store-locations) ← NEW FINAL STEP
```

---

## Notes

- This is the **final step** in the flow - no automatic advancement
- Map image will be a static placeholder (can be replaced with Google Maps embed later)
- Store logo uses existing Ashley HomeStore branding
- Location data is hardcoded (future: could be fetched via API based on user's postal code)
- Action links (Website, Get Directions, Call) will be placeholder links initially
- Mobile responsive: stack columns vertically on smaller screens

---

## Approval

Please review this plan and let me know if you'd like any changes before I proceed with implementation.
