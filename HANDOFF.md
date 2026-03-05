# Better Sleep Tonight - Project Handoff Guide

This document covers the services and accounts that need to be set up or transferred so your team can fully own and operate this project.

## 1. GitHub Repository

The repository is currently owned by **mstenquist** (mark@visualboston.com).

### To transfer the repo to your GitHub account/org:

1. Go to the repository on GitHub
2. Click **Settings** > scroll to **Danger Zone**
3. Click **Transfer repository**
4. Enter your GitHub organization or account name as the new owner
5. Confirm the transfer

After transfer:
- All issues, PRs, and commit history will be preserved
- Any existing links to the old URL will redirect automatically
- Update your local git remote:
  ```bash
  git remote set-url origin https://github.com/YOUR_ORG/better-sleep-tonight.git
  ```

---

## 2. Vercel (Hosting & Deployment)

The site is deployed on Vercel, linked to the GitHub repo.

### Option A: Transfer the Vercel project

1. Ask Mark (mark@visualboston.com) to add your Vercel account as a team member
2. Once added, the project can be transferred to your Vercel team/account
3. Go to **Project Settings** > **General** > **Transfer Project**

### Option B: Create a new Vercel project (recommended after GitHub transfer)

1. Sign up or log in at [vercel.com](https://vercel.com)
2. Click **Add New Project**
3. Import the GitHub repository (after it's been transferred to your account)
4. Vercel will auto-detect it as a Next.js project
5. Add the following environment variables in **Project Settings** > **Environment Variables**:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Your Mapbox access token (see Section 3) |
| `NEXT_PUBLIC_TINA_CLIENT_ID` | Your TinaCMS client ID (see Section 4) |
| `TINA_TOKEN` | Your TinaCMS read-only token (see Section 4) |
| `NEXT_PUBLIC_APP_URL` | Your production URL (e.g. `https://your-domain.com`) |

6. Deploy. Vercel will build and deploy automatically on every push to `main`.

### Custom Domain

If you have a custom domain, add it in **Project Settings** > **Domains** and update your DNS records as Vercel instructs.

---

## 3. Mapbox (Store Locator Map & Geocoding)

The store locator map and address geocoding use **Mapbox** (not Google Maps).

### To set up your own Mapbox account:

1. Sign up at [mapbox.com](https://www.mapbox.com)
2. Go to your **Account** page
3. Copy your **Default public token** (or create a new one)
4. Update the `NEXT_PUBLIC_MAPBOX_TOKEN` environment variable in Vercel (and in your local `.env` for development)

### Where Mapbox is used in the code:
- **Store locator map**: `src/components/StoreMap/StoreMap.tsx`
- **Address geocoding**: `src/lib/geocoding.ts`

### Pricing
Mapbox offers a generous free tier (50,000 map loads/month, 100,000 geocoding requests/month). You likely won't need a paid plan unless traffic is very high.

---

## 4. TinaCMS (Content Management)

TinaCMS manages the quiz flow content, step types, input types, and store locations. Content files are stored as JSON in the `content/` directory and are version-controlled in the repo.

### To set up your own TinaCMS account:

1. Sign up at [tina.io](https://tina.io)
2. Create a new project and link it to your GitHub repository
3. In the TinaCMS dashboard, go to **Project Settings** and note your:
   - **Client ID** (`NEXT_PUBLIC_TINA_CLIENT_ID`)
   - **Read-only Token** (`TINA_TOKEN`)
4. Add these as environment variables in Vercel and your local `.env`

### Local development with TinaCMS:

You can run TinaCMS locally without cloud credentials:

```bash
npm run dev:tina
```

This starts the local content API. To edit content, visit `http://localhost:3000/admin`.

### Content structure:

| Folder | Purpose |
|---|---|
| `content/flows/` | Quiz flow definitions |
| `content/stepTypes/` | Step type configurations (header, question, etc.) |
| `content/inputTypes/` | Input type definitions (radio, checkbox, etc.) |
| `content/locations/` | Store location data |

---

## Summary Checklist

- [ ] **GitHub**: Transfer repo from `mstenquist` to your account/org
- [ ] **Vercel**: Set up new project or transfer existing one; configure environment variables
- [ ] **Mapbox**: Create account, get access token, update `NEXT_PUBLIC_MAPBOX_TOKEN`
- [ ] **TinaCMS**: Create account, link repo, get Client ID and Token, update env vars

## Questions?

Contact Mark Stenquist at mark@visualboston.com
