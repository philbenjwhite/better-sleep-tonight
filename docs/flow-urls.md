# Flow URLs

All variants share the same quiz. The `?flow=` parameter only changes the intro headline and subheadline phrase.

## Available flows

| URL | Headline |
|---|---|
| `https://www.bettersleeptonight.com/` | Waking up with back pain? Get Better Sleep Tonight! (default) |
| `https://www.bettersleeptonight.com/?flow=back-pain` | Waking up with back pain? (alias of default) |
| `https://www.bettersleeptonight.com/?flow=achesandpains` | Waking up with aches and pains? |
| `https://www.bettersleeptonight.com/?flow=wakeupwithaheadache` | Waking up with a headache? |
| `https://www.bettersleeptonight.com/?flow=hippain` | Waking up with hip pain? |
| `https://www.bettersleeptonight.com/?flow=wakeupfeelingtired` | Waking up feeling tired? |
| `https://www.bettersleeptonight.com/?flow=neckpain` | Waking up with neck pain? |
| `https://www.bettersleeptonight.com/?flow=shoulderpain` | Waking up with shoulder pain? |

## Other routes

- `https://www.bettersleeptonight.com/thank-you`, post-submission landing page shown after email capture.
- `?step=N`, dev-only query param that jumps directly to question N (1-indexed).
