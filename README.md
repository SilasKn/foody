# foody

A meal planning app for iOS. Create recipes with ingredients and photos, plan them
onto a calendar, and get the shopping list for the week aggregated automatically —
scaled to the number of servings you actually planned.

[foodytheapp.com](https://foodytheapp.com)

**On the App Store** · [Download](https://apps.apple.com/de/app/foody-dein-essensplaner/id6770601018
foody - dein Essensplaner) · [foodytheapp.com](https://foodytheapp.com)


## What it does

- **Recipes** — ingredients with quantities and units, servings, a photo per recipe.
  Each recipe is private by default and can be published for other users to browse.
- **Calendar** — schedule a recipe for a date as breakfast, lunch or dinner;
  reschedule by dragging it elsewhere.
- **Shopping list** — derived from what is scheduled, not maintained by hand.
  Ingredients are merged across recipes by name and unit, and quantities are scaled by
  `planned servings / recipe servings`
  ([`utils/aggregateIngredients.js`](apps/mobile/utils/aggregateIngredients.js)).
- **Account** — email/password auth, unique usernames checked while you type, and
  full self-service account deletion.

## Stack

| | |
|---|---|
| App | React Native 0.86 / Expo 57, React 19 |
| Navigation | React Navigation (native stack) |
| Backend | Supabase — Postgres, Auth, Storage, Edge Functions |
| Analytics | PostHog (EU host) |
| Tests | Jest (`jest-expo`) + React Native Testing Library |
| Website | static, deployed on Netlify |

## Layout

```
apps/mobile/            React Native app (the only npm project)
  providers/            auth, analytics and recipe state
  screens/              one file per screen
  components/           shared UI (header, tab bar, calendar, bottom sheets)
  utils/                supabase client, image upload, shopping-list aggregation
supabase/migrations/    SQL migrations
supabase/functions/     Edge Functions (account deletion)
website/                landing page, legal pages, password reset, email verification
docs/                   privacy and launch documentation
```

State lives in three context providers stacked in
[`App.js`](apps/mobile/App.js): `AuthProvider` (Supabase session, persisted to
AsyncStorage), `AnalyticsProvider` (PostHog), `RecipesProvider` (recipe list with a
`MINE` / `PUBLIC` filter mode).

Navigation is a single flat stack rather than nested auth/app navigators. The
navigator's `key` is tied to whether a session exists, so login, logout and account
deletion all reset the stack to the start screen through the same one-line mechanism.
Dialogs and forms are `transparentModal` screens over the current one.



## Running it locally

```bash
cd apps/mobile
npm install
npm start          # then press i for iOS, a for Android
npm test
```

The app needs its own Supabase project — this repo does not provision one, so it will
not start against a fresh checkout without one. Create
`apps/mobile/.env.local` with:

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_KEY=
```

The schema under `supabase/migrations/` covers the signup trigger, username
constraints and ingredient ownership; the remaining tables were created through the
Supabase dashboard and are not yet versioned here.
