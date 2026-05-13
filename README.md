# Plant-AI

Offline-first crop diagnosis and agronomy guidance for smallholder farmers.

Plant-AI uses local image embeddings for the scan decision and local Gemma for farmer-friendly reasoning. The admin panel creates embeddings for verified crop disease reference images, saves them in Supabase, and the mobile app syncs them locally with Supastash/SQLite. When a farmer scans a leaf offline, the phone creates the query embedding with the same model, searches local reference embeddings, retrieves treatments/guides, and uses Gemma to explain the answer.

## Current Architecture

- **Image embedding model:** MobileCLIP-S0 by default.
- **Mobile runtime:** ONNX Runtime React Native for the MobileCLIP image encoder.
- **Admin runtime:** same MobileCLIP model via ONNX Runtime Node in the Next.js admin project.
- **Language model:** Gemma GGUF through `llama.rn` for explanation, JSON formatting, language output, and follow-up chat. It is not the primary visual classifier.
- **Sync:** Supabase + Supastash, with SQLite snapshot for first install and deltas afterward.
- **Offline scan:** local image embedding -> local similarity search -> local knowledge retrieval -> local Gemma answer.

## Docs

1. [Project overview](docs/00-overview.md)
2. [Mobile app plan](docs/01-mobile-app-plan.md)
3. [Admin panel plan](docs/02-admin-panel-plan.md)
4. [Backend Supabase plan](docs/03-backend-supabase-plan.md)
5. [Local embedding retrieval plan](docs/04-local-retrieval-plan.md)
6. [Data ingestion plan](docs/05-data-ingestion-plan.md)
7. [Build roadmap](docs/06-build-roadmap.md)
8. [Design plan](docs/07-design-plan.md)
9. [Mobile screens with uniwind](docs/08-mobile-screens-uniwind.md)

## Development

```bash
bun install
npx tsc --noEmit
npx expo-doctor
npm run start
```

Expo lint is configured with `eslint.config.js`; run:

```bash
./node_modules/.bin/eslint src app.config.ts metro.config.js
```
