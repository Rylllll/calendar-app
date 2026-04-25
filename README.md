# Voyagr Planner

An offline-first calendar and travel planner built with Expo SDK 55, React Native 0.83, Expo Router, TypeScript, Zustand, and AsyncStorage.

## What’s included

- Local-first planner state with persisted events, trip data, checklist progress, budget entries, booking watches, themes, and QR payloads
- `app/(tabs)` navigation with a stack route for the map itinerary view
- Adaptive dashboard that changes when trip mode is active
- Predictive schedule heuristics for packing, airport transfer, waiting time, and ride reminders
- Map-based itinerary view with native `react-native-maps` support and a gesture-driven scrubber
- Gamified checklist, streak/reward themes, collaborative readiness simulation, and a living budget system
- Weather enhancement via Open-Meteo with graceful offline fallback

## Project structure

```text
app/
  _layout.tsx
  map-itinerary.tsx
  (tabs)/
    _layout.tsx
    index.tsx
    calendar.tsx
    trip.tsx
    budget.tsx
    settings.tsx
src/
  components/
  hooks/
  mocks/
  providers/
  services/
  store/
  theme/
  types/
  utils/
```

## Run locally

```bash
npm install
npm run start
```

Useful commands:

```bash
npm run android
npm run ios
npm run web
npm run typecheck
npm run lint
```

## Architecture notes

- State management: Zustand store in [src/store/planner-store.ts](/C:/Users/Reymark/Documents/Codex/2026-04-24/you-are-an-expert-react-native/src/store/planner-store.ts)
- Persistence: AsyncStorage adapter in [src/services/storage.ts](/C:/Users/Reymark/Documents/Codex/2026-04-24/you-are-an-expert-react-native/src/services/storage.ts)
- Heuristics: travel, logistics, readiness, and budget logic in [src/services/travel-heuristics.ts](/C:/Users/Reymark/Documents/Codex/2026-04-24/you-are-an-expert-react-native/src/services/travel-heuristics.ts)
- Weather enhancement: [src/services/weather-service.ts](/C:/Users/Reymark/Documents/Codex/2026-04-24/you-are-an-expert-react-native/src/services/weather-service.ts)
- Theme system: [src/theme/index.ts](/C:/Users/Reymark/Documents/Codex/2026-04-24/you-are-an-expert-react-native/src/theme/index.ts)

## Notes

- The app works offline after initial install because planner data persists locally and the weather widget falls back to cached state.
- `react-native-maps` renders on native platforms. Web uses a lightweight itinerary fallback card instead of a full map.
- If you want live booking or traffic providers later, replace the service implementations and keep the store/UI layer intact.
