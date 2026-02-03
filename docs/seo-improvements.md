# Accessibility Audit: better-sleep-tonight.vercel.app

**Tested:** January 30, 2026  
**Tool:** axe-core 4.8.3  
**Pages tested:** Home, Steps 1, 2, 8, 11, 14

---

## ❌ Serious Issues

### 1. Nested Interactive Controls

**WCAG:** 4.1.2 Name, Role, Value  
**Pages:** Step 11 (Product Recommendations), Step 14 (Store Locations)

**Problem:** Buttons nested inside other buttons/interactive elements. Screen readers can't navigate properly, keyboard focus breaks.

**Component:** `ProductRecommendations_cardMain__sS0SK`

```html
<!-- Current (broken) -->
<div class="ProductRecommendations_cardMain__sS0SK" role="button" tabindex="0">
  <!-- card content -->
  <button>More Info</button>
  <!-- ❌ Nested interactive -->
</div>
```

```html
<!-- Fixed -->
<article class="ProductRecommendations_cardMain__sS0SK">
  <!-- card content -->
  <button>Select This Mattress</button>
  <button>More Info</button>
</article>
```

**Component:** `StoreLocations_locationCard__VGCNS`

```html
<!-- Current (broken) -->
<button type="button" class="StoreLocations_locationCard__VGCNS">
  <!-- content with focusable elements inside -->
</button>
```

```html
<!-- Fixed -->
<article class="StoreLocations_locationCard__VGCNS">
  <!-- content -->
  <button>Select This Store</button>
</article>
```

---

### 2. Color Contrast - Footer Text

**WCAG:** 1.4.3 Contrast (Minimum)  
**Page:** Step 14 (Store Locations)

**Component:** `Footer_word__irLG5`

```html
<span class="Footer_word__irLG5">schedule</span>
```

**Current contrast:** 2.09:1 ❌  
**Required:** 4.5:1

```css
/* Current (fails) */
.Footer_word__irLG5 {
  color: #acaaa6;
  background: #f6f3ed;
}

/* Fixed */
.Footer_word__irLG5 {
  color: #767472; /* 4.5:1 contrast */
}
```

---

## ⚠️ Moderate Issues

### 3. Heading Order Skip

**WCAG:** 1.3.1 Info and Relationships  
**Page:** Homepage

**Problem:** Page jumps from h1 to h3, skipping h2.

**Component:** `DevPanel_title__5xVL9`

```html
<!-- Current -->
<h1>Wake Up Without Back Pain</h1>
<!-- ... -->
<h3 class="DevPanel_title__5xVL9">Dev Panel</h3>
```

**Fix:** Hide Dev Panel in production, or change to h2.

---

### 4. Dev Panel Visible in Production

**Page:** All pages  
**Toggle:** Press `/` key

This should be hidden from production builds entirely.

---

## ✅ Passing (33-38 checks per page)

- ✓ Main landmark present
- ✓ Images have alt text
- ✓ Form labels present
- ✓ Language attribute set
- ✓ Link text is descriptive
- ✓ No keyboard traps
- ✓ Focus indicators present

---

## Summary

| Issue                       | Severity    | Component                              | Fix Effort |
| --------------------------- | ----------- | -------------------------------------- | ---------- |
| Nested interactive controls | 🔴 Serious  | ProductRecommendations, StoreLocations | Medium     |
| Color contrast (footer)     | 🔴 Serious  | Footer_word                            | Easy       |
| Heading order               | 🟡 Moderate | DevPanel_title                         | Easy       |
| Dev Panel in production     | 🟡 Moderate | DevPanel                               | Easy       |

---

## Priority Order

1. Remove nested buttons from product/store cards
2. Fix footer text contrast
3. Hide Dev Panel in production
