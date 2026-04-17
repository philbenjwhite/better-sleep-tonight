# TDG-Owned Store Filter — Ontario Locations

**Date:** 2026-04-16
**File changed:** `content/locations/ontario-stores.json`
**Status:** Confirmed by team — ready to commit

---

## Context

The Ontario store locator previously listed all 27 Ashley HomeStore locations in the province. Many of these are operated by independent licensees who will **not** honor TDG's $200 Tempur-Pedic promotion (coupon code `200offtempur`, applied via the Buy Now link).

Only TDG-owned participating stores should surface in the locator so that users aren't directed to a location that won't apply the discount.

TDG's canonical list of participating stores:
https://ashleyhomestore.ca/pages/participating-stores

At the time of this change, the TDG page lists **39 participating stores nationwide** — Ontario 19, Alberta 8, British Columbia 7, Manitoba 3, Saskatchewan 2. This project only ships the Ontario subset.

---

## Change — Filter `ontario-stores.json` to TDG participating locations

Reduced the `locations` array from **27 → 19** entries to match the 19 Ontario stores on the TDG participating-stores page.

### Kept (19 stores)

| City | Address |
|------|---------|
| Barrie | 30 North Village Way, Unit 4 |
| Brampton | 70 Great Lakes Dr, Unit 149 |
| Brantford | 184 Lynden Rd |
| Burlington | 7-3060 Davidson Court |
| Guelph | 389 Woodlawn Rd W |
| Kitchener | D2-655 Fairway Rd S |
| London | 3325 Wonderland Rd South, Unit 1 |
| Mississauga (Mavis) | 5900 Mavis Rd, Unit 2 |
| Mississauga Clearance Centre (Matheson) | 333 Matheson Blvd W |
| Newmarket | 17700 Yonge Street |
| Ottawa | 530 West Hunt Club Rd |
| Richmond Hill | 45 Red Maple Rd |
| Scarborough | 23 William Kitchen Rd, H3 |
| St. Catharines | 285 Geneva St |
| Stoney Creek | 1776 Stone Church Rd E, Unit 2 |
| Toronto | 1602 The Queensway |
| Vaughan | 7979 Weston Rd |
| Whitby | 1650 Victoria St E, Unit 5A |
| Windsor | 1-650 Division Rd |

### Removed (8 stores not on TDG's participating list)

Presumed independent-licensee locations — would not honor the $200 promotion:

- Belleville
- Espanola
- Kingston
- North Bay
- Prescott
- Sault Ste. Marie
- Sudbury
- Thunder Bay

### Renamed — confirmed same physical store

The prior `Woodbridge Ashley HomeStore` (3900 Hwy 7) has been renamed to match TDG's naming on the participating-stores page:

- **Before:** `Woodbridge Ashley HomeStore` — 3900 Hwy 7
- **After:** `Vaughan Ashley HomeStore` — 7979 Weston Rd

Both addresses share the same phone number (`+16474273900`) and refer to the same physical store at the Hwy 7 / Weston Rd intersection. Team has confirmed this is the same location — renaming so the locator matches TDG's language.

Coordinates for this entry were kept as previously set (`{ lat: 43.7942, lng: -79.5932 }`). Worth re-geocoding `7979 Weston Rd, Vaughan, ON L4L 0L4` at some point to confirm accuracy, but the store is the same physical location either way.

---

## Metadata updates

```diff
- "description": "All Ashley HomeStore locations in Ontario, Canada",
+ "description": "TDG-owned Ashley HomeStore participating locations in Ontario, Canada",
...
- "updatedAt": "2026-01-27T00:00:00.000Z",
- "totalLocations": 27
+ "updatedAt": "2026-04-16T00:00:00.000Z",
+ "totalLocations": 19
```

---

## Testing notes

No test framework is configured on this project. To verify manually:

1. `npm run dev`
2. Progress through the quiz to the Store Locations step.
3. Search postal codes for **removed** stores (e.g. Belleville `K8N 2Z2`, Kingston `K7L 3N6`, Sudbury `P3A 1W6`) — those stores should no longer appear as nearest results.
4. Search a GTA postal code (e.g. `M5V 3A8`) — Toronto, Scarborough, Mississauga, Vaughan, Richmond Hill, and Whitby should still appear.

---

## Follow-ups

- [ ] Re-geocode `7979 Weston Rd, Vaughan, ON L4L 0L4` to verify coordinates on the Vaughan entry
- [ ] If TDG extends participation to other provinces in the future, add per-province collections beyond `ontario-stores`
