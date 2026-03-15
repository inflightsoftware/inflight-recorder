# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Inflight Recorder is a desktop screen recording tool (fork of Cap, the open source Loom alternative). It's a Turborepo monorepo with a Tauri v2 desktop app (Rust + SolidStart).

**Application:**
- `apps/desktop` — Tauri v2 desktop app with SolidStart (recording, editing)
  - Frontend: `src/` (SolidStart routes, components, stores)
  - Backend: `src-tauri/src/` (Rust IPC commands, events, platform-specific code)

**Shared Packages:**
- `packages/ui-solid` — SolidJS components for desktop (Kobalte + TailwindCSS)
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
pnpm dev                  # Start desktop app (via Turbo)
pnpm dev:desktop          # Start desktop app directly
pnpm with-env -- <cmd>    # Run any command with .env loaded
```

### Build & Quality
```bash
pnpm build                # Build all via Turbo
pnpm tauri:build          # Build desktop release
pnpm lint                 # Lint with Biome
pnpm format               # Format with Biome (ALWAYS run before completing work)
pnpm typecheck            # TypeScript check
cargo fmt                 # Format Rust code (ALWAYS run before completing work)
cargo build -p <crate>    # Build specific Rust crate
cargo test -p <crate>     # Test specific Rust crate
```

### Testing
```bash
cd apps/desktop && pnpm test              # Run desktop vitest tests
cargo test -p <crate>                     # Run Rust tests for specific crate
cargo test -p <crate> -- --nocapture      # Run with stdout visible
```

### Utilities
```bash
pnpm clean                                # Remove node_modules, .next, .output, .turbo, dist
pnpm check-tauri-versions                 # Verify Tauri plugin version consistency
```

## Critical Rules

### Auto-generated Files (NEVER EDIT)
- `**/tauri.ts` — IPC bindings (regenerated on app load)
- `**/queries.ts` — Query bindings
- `apps/desktop/src-tauri/gen/**` — Tauri generated files
- `packages/ui-solid/src/auto-imports.d.ts` — Auto-import type definitions

### NO CODE COMMENTS
**CRITICAL**: Never add comments (`//`, `/* */`, `///`, `//!`, `#`, etc.) to any code in any language (TypeScript, JavaScript, Rust, etc.). Code must be self-explanatory through:
- Clear, descriptive naming
- Type annotations
- Well-structured code organization

This rule applies to all code: new files, edits to existing files, and all languages in the repository.

### Server Management
Do not start additional dev servers unless asked. Assume the developer already has the environment running.

### Desktop Permissions (macOS)
When running from terminal, grant screen/mic permissions to the terminal app, not the Inflight app.

### Code Formatting
**ALWAYS format code before completing work:**
- Run `pnpm format` for TypeScript/JavaScript after any edits
- Run `cargo fmt` for Rust after any edits
- These commands should be run regularly during development and always at the end of a coding session

## Architecture Patterns

### Technology Stack
- **Package Manager**: pnpm 10.30.3
- **Node**: 20+
- **Rust**: 1.88+
- **Build**: Turborepo
- **Desktop**: Tauri v2, SolidStart, Solid.js
- **UI**: `@inflight/ui-solid` (SolidJS + Kobalte + TailwindCSS)
- **Testing**: Vitest (for TypeScript/JavaScript), Cargo test (for Rust)
- **Linting/Formatting**: Biome (TS/JS), rustfmt (Rust)

### Desktop Architecture
The desktop app follows a clear separation:
- **Frontend** (`apps/desktop/src/`):
  - SolidStart routes in `routes/`
  - Shared components in `components/`
  - State management stores in `store/` (minimal usage)
  - Auto-generated Tauri IPC bindings in `utils/tauri.ts`
- **Backend** (`apps/desktop/src-tauri/src/`):
  - Each module (e.g., `recording.rs`, `camera.rs`, `export.rs`) handles specific functionality
  - Commands are exposed via `#[tauri::command]` and automatically typed via specta
  - Events are defined with `#[derive(tauri_specta::Event)]` and emitted to frontend

### Desktop IPC (Tauri + specta)
Commands and events are type-safe via specta. The `tauri.ts` file is auto-generated on app load.

Rust command:
```rust
#[tauri::command]
#[specta::specta]
async fn start_recording(app: AppHandle, options: RecordingOptions) -> Result<(), String> {
    // implementation
}
```

Rust event emit:
```rust
#[derive(Serialize, Type, tauri_specta::Event, Debug, Clone)]
pub struct UploadProgress { progress: f64, message: String }

UploadProgress { progress: 0.5, message: "Uploading...".to_string() }
  .emit(&app).ok();
```

Frontend usage (auto-generated bindings):
```typescript
import { events, commands } from "~/utils/tauri";

await commands.startRecording({ ... });

await events.uploadProgress.listen((event) => {
  setProgress(event.payload.progress);
});
```

## Conventions

### Naming
- **Files**: kebab-case (`user-menu.tsx`, `recording-settings.rs`)
- **Directories**: kebab-case
- **Components**: PascalCase
- **Rust modules**: snake_case
- **Rust crates**: kebab-case

### Code Style
- **TypeScript/JavaScript**:
  - Indentation: Tabs (configured in Biome)
  - Quotes: Double quotes (configured in Biome)
  - Strict TypeScript; avoid `any`
  - Import organization: Auto-organized by Biome
- **Rust**:
  - Follow workspace lints defined in root `Cargo.toml`
  - Key enforced lints: `unused_must_use = "deny"`, `dbg_macro = "deny"`, `let_underscore_future = "deny"`
  - Use `rustfmt` for formatting

## Common Workflows

### Adding a new Tauri command
1. Define command in appropriate module in `apps/desktop/src-tauri/src/`
2. Add `#[tauri::command]` and `#[specta::specta]` attributes
3. Register command in `lib.rs` (if new module)
4. Restart dev server to regenerate `tauri.ts` bindings
5. Import and use from `~/utils/tauri` in frontend

### Adding a new Tauri event
1. Define event struct with `#[derive(Serialize, Type, tauri_specta::Event, Debug, Clone)]`
2. Emit via `.emit(&app)` in Rust code
3. Restart dev server to regenerate `tauri.ts` bindings
4. Listen via `events.yourEvent.listen()` in frontend

### Working with Rust crates
1. Make changes to crate code in `crates/<crate-name>/`
2. Test with `cargo test -p <crate-name>`
3. Format with `cargo fmt`
4. Build desktop app to verify integration: `pnpm dev:desktop`

## Troubleshooting

- **Turbo cache issues**: `pnpm clean` or `rm -rf .turbo`
- **IPC binding errors**: Restart dev server to regenerate `tauri.ts`
- **Node version**: Must be 20+
- **Clean rebuild**: `pnpm clean` removes all build artifacts and node_modules
- **Format on save not working**: Run `pnpm format` and `cargo fmt` manually before commits
