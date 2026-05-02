# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Essensplan** (app name: "foody") is a React Native meal planning app built with Expo. Users create and manage recipes, plan meals on a calendar, and browse public recipes. Backend is Supabase (PostgreSQL + Auth).

## Commands

All development happens in `apps/mobile/`:

```bash
cd apps/mobile
npm start          # Start Expo dev server
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm run web        # Run in browser
```

From the repo root, `npm run mobile` also starts the Expo server.

No build step, linter, or test runner is configured yet.

## Environment

`apps/mobile/.env.local` must contain:
```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_KEY=...
```

## Architecture

### Monorepo structure

```
apps/mobile/     # React Native Expo app (the only app currently)
supabase/migrations/  # SQL migrations run against the Supabase project
```

### State management via context providers

Two providers wrap the app in `App.js`:

- **`AuthProvider`** (`providers/AuthProvider.js`) — Wraps Supabase Auth. Exposes `{ user, signIn, signUp, signOut }` via `useAuth()`. Persists session with AsyncStorage.
- **`RecipesProvider`** (`providers/RecipesProvider.js`) — Loads recipes from Supabase. Supports two filter modes: `MINE` (user's own) and `PUBLIC` (all public). Fetches author usernames from `profiles`. Exposes `{ recipes, mode, setMode, loadRecipesForMode, refreshRecipesForMode, prependRecipe }` via `useRecipes()`.

### Navigation

Defined in `App.js` using React Navigation native stack:
- Unauthenticated → `LoginScreen`
- Authenticated → `ScreenShell` (wraps all main screens with header + bottom tab bar)
  - Home (`StartScreen`)
  - Recipes (`RecipesScreen`) — FlatList of recipe cards, FAB opens `AddRecipeScreen` modal
  - Calendar (`CalendarScreen`) — skeleton/WIP

### Database schema (Supabase/PostgreSQL)

- `auth.users` — Supabase managed
- `profiles` (`user_id`, `username`) — auto-created on signup via SQL trigger in `supabase/migrations/`
- `recipes` (`id`, `name`, `description`, `author`, `created_at`, `public`)
- `ingredients` (`id`, `name`)
- `recipe_ingredients` (`recipe_id`, `ingredient_id`, `quantity`, `unit`)

### Theming

Colors are defined in `apps/mobile/theme.js`: cream (`#FAF3E0`), white, black, accent green (`#7A9E7E`). Import from there instead of hardcoding hex values.
