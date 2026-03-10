# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Inflight Recorder is a desktop screen recording tool (fork of Cap, the open source Loom alternative). It's a Turborepo monorepo with a Tauri v2 desktop app (Rust + SolidStart).

**Application:**
- `apps/desktop` — Tauri v2 desktop app with SolidStart (recording, editing)

**Shared Packages:**
- `packages/ui-solid` — SolidJS components for desktop
- `packages/web-api-contract` — ts-rest API contracts for desktop license/API communication
- `packages/config` — Shared TypeScript and Vite configuration
- `packages/tsconfig` — Base TypeScript configuration

**Rust Crates** (`crates/*`):
- `recording` — Core recording functionality
- `media`, `audio`, `video-decode` — Media processing pipeline
- `rendering`, `rendering-skia` — Video rendering and effects
- `camera*` — Cross-platform camera handling (AVFoundation, DirectShow, MediaFoundation)
- `scap-*` — Screen capture implementations (ScreenCaptureKit, Direct3D)
- `enc-*` — Encoding implementations (FFmpeg, AVFoundation, MediaFoundation, GIF)
- `export`, `editor`, `project` — Export and editing functionality

## Key Commands

### Initial Setup
```bash
pnpm install              # Install dependencies
pnpm env-setup            # Generate .env file (interactive)
pnpm cap-setup            # Install native dependencies (FFmpeg, etc.)
```

### Development
```bash
pnpm dev                  # Start desktop app
pnpm dev:desktop          # Start desktop app (alias)
pnpm with-env -- <cmd>    # Run any command with .env loaded
```

### Build & Quality
```bash
pnpm build                # Build all via Turbo
pnpm tauri:build          # Build desktop release
pnpm lint                 # Lint with Biome
pnpm format               # Format with Biome
pnpm typecheck            # TypeScript check
cargo fmt                 # Format Rust code
cargo build -p <crate>    # Build specific Rust crate
cargo test -p <crate>     # Test specific Rust crate
```

## Critical Rules

### Auto-generated Files (NEVER EDIT)
- `**/tauri.ts` — IPC bindings (regenerated on app load)
- `**/queries.ts` — Query bindings
- `apps/desktop/src-tauri/gen/**` — Tauri generated files

### NO CODE COMMENTS
Never add comments (`//`, `/* */`, `///`, `//!`, `#`, etc.) to any code. Code must be self-explanatory through naming, types, and structure.

### Server Management
Do not start additional dev servers unless asked. Assume the developer already has the environment running.

### Desktop Permissions (macOS)
When running from terminal, grant screen/mic permissions to the terminal app, not the Inflight app.

## Architecture Patterns

### Technology Stack
- **Package Manager**: pnpm 10.30.3
- **Node**: 20+
- **Rust**: 1.88+
- **Build**: Turborepo
- **Desktop**: Tauri v2, SolidStart, Solid.js
- **UI**: `@inflight/ui-solid` (SolidJS + Kobalte + TailwindCSS)

### Desktop IPC (Tauri + specta)
Rust emit:
```rust
#[derive(Serialize, Type, tauri_specta::Event, Debug, Clone)]
pub struct UploadProgress { progress: f64, message: String }

UploadProgress { progress: 0.5, message: "Uploading...".to_string() }
  .emit(&app).ok();
```

Frontend listen (auto-generated):
```typescript
import { events, commands } from "./tauri";
await commands.startRecording({ ... });
await events.uploadProgress.listen((event) => {
  setProgress(event.payload.progress);
});
```

## Conventions

- **Directory naming**: lower-case-dashed
- **Components**: PascalCase
- **Rust modules**: snake_case
- **Rust crates**: kebab-case
- **Files**: kebab-case (`user-menu.tsx`)
- Strict TypeScript; avoid `any`
- Use Biome for TS/JS; rustfmt for Rust

## Troubleshooting

- **Turbo cache issues**: `rm -rf .turbo`
- **IPC binding errors**: Restart dev server to regenerate `tauri.ts`
- **Node version**: Must be 20+
- **Clean rebuild**: `pnpm clean`
