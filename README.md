# Plant-AI

Offline-first crop diagnosis and agronomy guidance for smallholder farmers.

Plant-AI uses on-device Gemma vision for crop disease diagnosis, MobileCLIP-S0 for reference evidence retrieval, and Supastash/SQLite for offline content, treatment plans, Ask threads, pest guides, weather cache, and field history.

## Current Architecture

- **Diagnosis model:** `crop-disease-finder-gemma4-E2B-it-Q4_K_M.gguf` with `mmproj-crop-disease-finder-gemma4-E2B-it-F16.gguf`.
- **Evidence embedding model:** MobileCLIP-S0.
- **Mobile runtime:** ONNX Runtime React Native for the MobileCLIP image encoder.
- **Admin runtime:** same MobileCLIP model via ONNX Runtime Node in the Next.js admin project.
- **Language model:** Gemma GGUF through `llama.rn` for diagnosis, explanation, JSON formatting, language output, and follow-up chat.
- **Sync:** Supabase + Supastash, with SQLite snapshot for first install and deltas afterward.
- **Offline scan:** demo path or camera/photo -> Gemma diagnosis -> local evidence and treatment retrieval -> local action plan.

## Judge Demo Path

Fresh Pixel install target: under three minutes without internet by using the bundled demo path.

1. Complete onboarding and choose **Skip & try demo** on model setup if the GGUF files are not present.
2. Open **Scan** and tap **Run demo scan**.
3. Review the diagnosis, evidence, symptoms, citations, and treatment plan.
4. Open **Treatment**, mark one checklist item, open dosage if available, and save an outcome.
5. Open **Advisor → Ask a question** and ask: `How to treat rice blast organically?`.
6. Open **Advisor → Calendar** and schedule a reminder when a field has crop/stage data.
7. Open **Me → About** to show model files, embedding contract, and offline architecture.

The bundled demo dataset contains 30 synthetic reference embeddings across tomato and rice disease/healthy classes. It is intentionally embedded in code so the judge path works without sync.

## Preview Builds

```bash
npm run lint
npx tsc --noEmit
npx expo export --platform web --output-dir /private/tmp/plant-ai-preview
eas build -p android -e preview --local --non-interactive
eas build -p ios -e preview --local --non-interactive
```

Native preview builds require local Android/iOS tooling and signing material. Static export verifies the route bundle, but OS notifications, camera, location, and `llama.rn` inference need device or simulator validation.

## Screenshots

Screenshot checklist lives in [`docs/screenshots/README.md`](docs/screenshots/README.md).

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
npm run lint
npm run start
```
