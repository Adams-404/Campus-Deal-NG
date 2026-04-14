# Campus Deal — AI Project Context

## What is this project?
Campus Deal is a student marketplace platform. This repo contains the full source code 
of the web application. Read through it to understand the features, user flows, data 
models, API structure, and branding before doing anything else.

## Monorepo Structure
- `/` → the Campus Deal web app (source of truth)
- `/mobile` → Flutter mobile app (initialized, work in progress)

## Your job in /mobile
Build a Flutter mobile version of Campus Deal that:
- Mirrors the core features and user flows from the web app
- Uses a clean structure: `features/`, `models/`, `services/`, `widgets/`, `screens/`
- State management: Riverpod or BLoC depending on complexity
- Routing: go_router
- Talks to the same backend/API as the web app (reuse existing endpoints)
- Matches the branding and feel of the web app
- Includes: auth flow, settings screen, and proper navigation (bottom nav or drawer)

## Important
- Do NOT guess or hallucinate features — base everything strictly on the web app source
- If something is unclear, flag it before assuming
- Always explore the project structure first, then summarize what you found before writing code

## Future plan
When the Flutter app is complete and stable, `/mobile` will be extracted into 
its own standalone repository. So keep the Flutter project fully self-contained — 
no hardcoded paths or dependencies that assume it lives inside this monorepo.