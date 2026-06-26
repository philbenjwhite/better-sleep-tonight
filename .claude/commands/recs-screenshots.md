Take before/after screenshots of the ProductRecommendations step for all 4 state combinations (alone vs with-partner × ready-to-buy vs not-ready-to-buy), then combine them into side-by-side comparison images.

## Requirements

The dev server must be running at http://localhost:3000 before this command is used. If it is not running, tell the user to start it with `npm run dev` and stop.

## Steps

1. Check that the dev server is up:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```
If the response is not `200`, stop and tell the user to run `npm run dev` first.

2. Run the screenshot script (captures all 4 combos × desktop + mobile, for both the current working-tree state and prod/stashed state):
```bash
node scripts/screenshot-recommendations.js
```

3. Run the combine script (stitches each prod + with-changes pair into a side-by-side before/after image):
```bash
node scripts/combine-screenshots.js
```

4. Open the comparison folder in Finder:
```bash
open screenshots/comparison
```

5. Tell the user where the output lives:
- `screenshots/comparison/` — 8 before/after images (4 combos × desktop + mobile)
- `screenshots/for-client/` — clean single-state shots if they exist from a previous run

## Notes

- Both scripts are in `scripts/` at the project root.
- The screenshot script automatically stashes only the two ProductRecommendations component files (`.tsx` and `.module.css`) to capture the prod baseline, then restores them — so the working tree is clean when it finishes.
- If there are no uncommitted changes to those files, only a single `prod` pass runs (no `with-changes` folder).
- To retake just the client-facing pair (ready-to-buy and not-ready-to-buy, no before/after), the one-liner is in the conversation history.
