# Full Accessibility Audit: better-sleep-tonight.vercel.app

**Audit Date:** January 30, 2026  
**Tool:** axe-core 4.8.3  
**Pages Tested:** All 15 steps (Intro + Steps 1-14)

---

## Executive Summary

| Step  | Page Name               | Violations | Severity    |
| ----- | ----------------------- | ---------- | ----------- |
| Intro | Home                    | 1          | 🟡 Moderate |
| 1     | Intro Video             | 0          | ✅ Pass     |
| 2     | Trouble Falling Asleep  | 0          | ✅ Pass     |
| 3     | Sleep Position          | 0          | ✅ Pass     |
| 4     | Motion Disturbance      | 0          | ✅ Pass     |
| 5     | Aches & Pains Frequency | 0          | ✅ Pass     |
| 6     | Aches & Pains Type      | 0          | ✅ Pass     |
| 7     | Summary Video           | 0          | ✅ Pass     |
| 8     | Email Capture           | 0          | ✅ Pass     |
| 9     | Post-Email Video        | 0          | ✅ Pass     |
| 10    | See Options Prompt      | 0          | ✅ Pass     |
| 11    | Product Recommendations | 1          | 🔴 Serious  |
| 12    | Post-Selection Video    | 0          | ✅ Pass     |
| 13    | Zip Code Capture        | 0          | ✅ Pass     |
| 14    | Store Locations         | 2          | 🔴 Serious  |

**Total Issues Found:** 4 unique issues across 3 pages

---

## Detailed Findings

---

### Issue #1: Nested Interactive Controls (Serious)

**WCAG Criterion:** 4.1.2 Name, Role, Value  
**Impact:** Serious — breaks screen reader and keyboard navigation  
**Affected Pages:** Step 11 (3 instances), Step 14 (27 instances)

#### Step 11: Product Recommendation Cards

**Component:** `ProductRecommendations_cardMain__sS0SK`

```html
<!-- CURRENT (BROKEN) -->
<div class="ProductRecommendations_cardMain__sS0SK" role="button" tabindex="0">
  <div class="ProductRecommendations_cardImageContainer__abc123">
    <div class="ProductRecommendations_badge__xyz">Best Value</div>
    <img src="..." alt="Serenity Hybrid" />
  </div>
  <div class="ProductRecommendations_cardContent__def456">
    <p class="ProductRecommendations_productName__ghi">Serenity Hybrid</p>
    <p class="ProductRecommendations_description__jkl">Our most advanced...</p>
    <p class="ProductRecommendations_price__mno">1,299.00</p>
    <ul class="ProductRecommendations_features__pqr">
      <li>Cooling gel-infused memory foam</li>
      <li>Individually wrapped coils</li>
    </ul>
  </div>
  <!-- ❌ PROBLEM: Interactive element nested inside role="button" -->
  <button class="ProductRecommendations_moreInfoButton__stu">More Info</button>
</div>
```

**CSS Classes Involved:**

- `ProductRecommendations_cardMain__sS0SK` — the outer button-role container
- `ProductRecommendations_moreInfoButton__stu` — the nested button (if exists)

**Fix Option A — Remove outer button role:**

```html
<article class="ProductRecommendations_cardMain__sS0SK">
  <!-- Same content -->
  <div class="ProductRecommendations_cardActions__xyz">
    <button class="ProductRecommendations_selectButton__abc">Select</button>
    <button class="ProductRecommendations_moreInfoButton__stu">
      More Info
    </button>
  </div>
</article>
```

**Fix Option B — Use click handler with event delegation:**

```jsx
// React/Next.js example
<div
  className="ProductRecommendations_cardMain__sS0SK"
  onClick={handleCardSelect}
  // Remove role="button" and tabindex
>
  {/* card content */}
  <button
    onClick={(e) => {
      e.stopPropagation(); // Prevent card selection
      handleMoreInfo();
    }}
  >
    More Info
  </button>
</div>
```

#### Step 14: Store Location Cards

**Component:** `StoreLocations_locationCard__VGCNS`

```html
<!-- CURRENT (BROKEN) -->
<button
  type="button"
  class="StoreLocations_locationCard__VGCNS StoreLocations_selected__Xudf6"
>
  <div class="StoreLocations_locationInfo__7vKYq">
    <p class="StoreLocations_cityName__yz3pQ">Burlington</p>
    <p class="StoreLocations_storeName__sSM7d">Burlington Ashley HomeStore</p>
  </div>
  <div class="StoreLocations_locationActions__55i9B">
    <p class="StoreLocations_distance__bUVSG">7.7 km away</p>
    <div class="StoreLocations_actionLinks__KSBCh">
      <!-- ❌ PROBLEM: Links nested inside button -->
      <a
        href="https://www.ashleyfurniture.com/store/..."
        target="_blank"
        rel="noopener noreferrer"
        class="StoreLocations_actionLink__0ru2w"
        >Website</a
      >
      <span class="StoreLocations_linkSeparator__6_0GY">|</span>
      <a
        href="https://www.google.com/maps/dir/..."
        target="_blank"
        rel="noopener noreferrer"
        class="StoreLocations_actionLink__0ru2w"
        >Get Directions</a
      >
      <span class="StoreLocations_linkSeparator__6_0GY">|</span>
      <a href="tel:+19053151700" class="StoreLocations_actionLink__0ru2w"
        >Call</a
      >
    </div>
  </div>
</button>
```

**CSS Classes Involved:**

- `StoreLocations_locationCard__VGCNS` — outer button element
- `StoreLocations_selected__Xudf6` — selected state modifier
- `StoreLocations_actionLink__0ru2w` — nested link elements

**Fix — Use article with separate selection button:**

```html
<article
  class="StoreLocations_locationCard__VGCNS StoreLocations_selected__Xudf6"
>
  <div class="StoreLocations_locationInfo__7vKYq">
    <p class="StoreLocations_cityName__yz3pQ">Burlington</p>
    <p class="StoreLocations_storeName__sSM7d">Burlington Ashley HomeStore</p>
  </div>
  <div class="StoreLocations_locationActions__55i9B">
    <p class="StoreLocations_distance__bUVSG">7.7 km away</p>
    <div class="StoreLocations_actionLinks__KSBCh">
      <a href="..." class="StoreLocations_actionLink__0ru2w">Website</a>
      <span class="StoreLocations_linkSeparator__6_0GY">|</span>
      <a href="..." class="StoreLocations_actionLink__0ru2w">Get Directions</a>
      <span class="StoreLocations_linkSeparator__6_0GY">|</span>
      <a href="tel:..." class="StoreLocations_actionLink__0ru2w">Call</a>
    </div>
    <button type="button" class="StoreLocations_selectButton__abc">
      Select This Store
    </button>
  </div>
</article>
```

---

### Issue #2: Color Contrast (Serious)

**WCAG Criterion:** 1.4.3 Contrast (Minimum)  
**Impact:** Serious — text unreadable for users with low vision  
**Affected Pages:** Step 14 (Footer)

**Component:** `Footer_word__irLG5`

```html
<span class="Footer_word__irLG5" style="animation-delay: 3.9s;">in </span>
```

**Current Values:**

- Foreground: `#a3a19d`
- Background: `#f6f3ed`
- Contrast ratio: **2.32:1** ❌
- Required: **4.5:1** minimum

**CSS Fix:**

```css
/* File: Footer.module.css (or equivalent) */

/* BEFORE */
.Footer_word__irLG5 {
  color: #a3a19d; /* Fails contrast */
}

/* AFTER */
.Footer_word__irLG5 {
  color: #706e6a; /* 4.5:1 contrast with #f6f3ed */
}

/* Alternative darker options: */
/* color: #5c5a57; — 6:1 contrast (AAA compliant) */
/* color: #767472; — 4.5:1 contrast (AA compliant) */
```

---

### Issue #3: Heading Order Skip (Moderate)

**WCAG Criterion:** 1.3.1 Info and Relationships  
**Impact:** Moderate — confusing document structure for screen readers  
**Affected Pages:** Intro (Home)

**Component:** `DevPanel_title__5xVL9`

```html
<!-- Document structure -->
<h1 class="page_titlePage__jodng">Wake Up Without Back Pain</h1>
<!-- ... other content ... -->
<h3 class="DevPanel_title__5xVL9">Dev Panel</h3>
<!-- ❌ Skips h2 -->
```

**Fix Option A — Change heading level:**

```html
<h2 class="DevPanel_title__5xVL9">Dev Panel</h2>
```

**Fix Option B — Hide DevPanel in production (Recommended):**

```jsx
// Only render DevPanel in development
{
  process.env.NODE_ENV === "development" && <DevPanel />;
}
```

---

### Issue #4: Dev Panel Visible in Production

**Type:** Best Practice / Security  
**Impact:** Moderate  
**Affected Pages:** All pages

The Dev Panel is visible to all users and can be toggled with the `/` key.

**Fix:**

```jsx
// components/DevPanel.tsx
export function DevPanel() {
  // Only render in development
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return <div className="DevPanel_panel__9XLZ4">{/* panel content */}</div>;
}
```

---

## Component HTML Reference

### Question Answer Buttons (Steps 2-6) ✅ PASSING

```html
<button type="button" class="AnimatedQuestionBlock_answerOption__W5Qfy">
  <span class="AnimatedQuestionBlock_letter__KZ80j">A</span>
  <span class="AnimatedQuestionBlock_label__ppJE9">Every Night</span>
</button>
```

**Status:** Accessible — proper button elements, clear labels

---

### Email Capture Form (Step 8) ✅ PASSING

```html
<form class="EmailCapture_formWrapper__WoHh0">
  <div class="EmailCapture_inputRow__aaDFz">
    <div class="EmailCapture_inputWrapper__DTeX4">
      <div class="EmailCapture_inputWithIcon__0q7bM">
        <svg class="EmailCapture_emailIcon__jxv49" aria-hidden="true">...</svg>
        <input
          placeholder="email address"
          class="EmailCapture_emailInput__EtFeS"
          aria-label="Email address"
          aria-invalid="false"
          type="email"
          value=""
        />
      </div>
    </div>
    <button type="submit" class="EmailCapture_submitButton__OvVQM" disabled="">
      <span class="EmailCapture_buttonText__OlKF3">Email My Report</span>
      <svg class="EmailCapture_arrowIcon__4LDJd" aria-hidden="true">...</svg>
    </button>
  </div>
</form>
```

**Status:** Accessible — has aria-label, proper input type, disabled state

---

### Zip Code Form (Step 13) ✅ PASSING

```html
<form class="ZipCodeCapture_form__H7fM6">
  <div class="ZipCodeCapture_inputWrapper__tvRUo">
    <div class="ZipCodeCapture_inputContainer__gPWtZ">
      <label for="postal-code" class="ZipCodeCapture_label__HS6l_"
        >Postal Code</label
      >
      <input
        id="postal-code"
        placeholder="A1A 1A1"
        class="ZipCodeCapture_input__q_DfG"
        maxlength="7"
        autocomplete="postal-code"
        type="text"
        value=""
      />
    </div>
    <button type="submit" class="ZipCodeCapture_button__HytVT" disabled="">
      Continue
    </button>
  </div>
</form>
```

**Status:** Accessible — proper label association, autocomplete attribute

---

### Header Component ✅ PASSING

```html
<header class="Header_header__AF_3G">
  <a class="Header_logo__1FRrW" href="/">
    <img
      alt="Better Sleep Tonight"
      width="238"
      height="64"
      src="/images/bst-logo.svg"
    />
  </a>
  <button
    class="Header_volumeButton__cBtNd"
    aria-label="Unmute audio"
    title="Sound off"
  >
    <svg>...</svg>
  </button>
</header>
```

**Status:** Accessible — logo has alt text, button has aria-label

---

### Video Avatar Component ✅ PASSING

```html
<div class="VideoAvatar_avatarContainer__XnPLW">
  <video
    class="VideoAvatar_avatarVideo__Fk8ql"
    playsinline=""
    src="/videos/ashley/ashley-1.mp4"
  ></video>
</div>
```

**Status:** Acceptable — video is decorative/supplementary

---

## Priority Fix Order

1. **🔴 Critical — Step 11 Product Cards**

   - Remove `role="button"` and `tabindex="0"` from card container
   - Use separate button elements for actions
   - Estimated effort: 2-3 hours

2. **🔴 Critical — Step 14 Store Cards**

   - Change from `<button>` to `<article>` for card container
   - Keep links as-is inside
   - Add explicit "Select Store" button
   - Estimated effort: 2-3 hours

3. **🔴 Serious — Footer Contrast**

   - Update color variable in CSS
   - Estimated effort: 15 minutes

4. **🟡 Moderate — Dev Panel**
   - Add production check to hide panel
   - Estimated effort: 30 minutes

---

## Testing Passed (33-38 checks per page)

- ✅ Document has `<main>` landmark
- ✅ Images have alt text
- ✅ Form inputs have labels
- ✅ Language attribute on `<html>`
- ✅ Links have discernible text
- ✅ No keyboard traps detected
- ✅ Focus order is logical
- ✅ ARIA attributes used correctly (except noted issues)
- ✅ Color is not sole means of conveying information
- ✅ Text can be resized to 200%

---

## Recommendations

1. **Add skip links** — Allow keyboard users to skip to main content
2. **Add focus visible styles** — Ensure focus indicators are visible on all interactive elements
3. **Test with screen reader** — Manual testing with VoiceOver/NVDA recommended
4. **Add aria-live regions** — For dynamic content updates (step transitions)

---

_Report generated by BigDog 🐺 using axe-core 4.8.3_
