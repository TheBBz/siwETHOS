# Sign in with Ethos - Copilot Instructions

This document provides shared context for all GitHub Copilot agents working on the siwETHOS project.

## Project Overview

**Sign in with Ethos (siwETHOS)** is an OAuth 2.0-compatible authentication system that verifies user credibility through [Ethos Network](https://ethos.network) reputation scores. It supports wallet-based authentication (SIWE) and social providers (Discord, Farcaster, Telegram, Twitter).

## Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| **Runtime** | Node.js | ≥18 |
| **Package Manager** | pnpm | ≥8 |
| **Language** | TypeScript | 5.x (strict mode, ESM) |
| **Build Tool** | tsup | Bundles to CJS + ESM, generates `.d.ts` |
| **Testing** | Vitest | 1.x with @vitest/coverage-v8 |
| **Linting** | ESLint | 9.x (flat config) with typescript-eslint |
| **Demo Framework** | Next.js | 16 (App Router) |
| **React** | React | 19 |
| **Styling** | Tailwind CSS | 4 |

## Repository Structure

This is a **pnpm workspace monorepo** with two main areas:

```
signinwithethos/              # Main monorepo
├── .github/
│   ├── agents/               # Agent-specific instructions
│   ├── workflows/            # CI/CD (ci.yml, publish.yml)
│   └── copilot-instructions.md  # This file (shared context)
├── docs/                     # Documentation (Markdown)
│   ├── sdk-usage.md
│   ├── react-components.md
│   └── self-hosting.md
├── packages/
│   ├── sdk/                  # @thebbz/siwe-ethos - Core SDK
│   ├── react/                # @thebbz/siwe-ethos-react - React components
│   └── providers/            # SIWE provider utilities
├── package.json              # Root workspace config
├── pnpm-workspace.yaml
└── tsconfig.json

siwETHOS-demo/                # Demo/OAuth server (Next.js 16)
├── src/
│   ├── app/
│   │   ├── api/              # API routes (Next.js App Router)
│   │   │   ├── authorize/    # OAuth authorization
│   │   │   ├── token/        # Token exchange
│   │   │   ├── userinfo/     # User profile
│   │   │   └── auth/         # Provider-specific endpoints
│   │   └── [pages]/          # UI pages
│   ├── components/           # React components
│   └── lib/                  # Shared utilities
├── package.json
└── vercel.json               # Deployment config
```

## NPM Scripts

### Root (signinwithethos/)
```bash
pnpm build          # Build all packages
pnpm lint           # Lint all packages
pnpm test           # Run all tests
pnpm clean          # Clean all dist folders
pnpm docs:lint      # Lint documentation files
```

### Per-Package (sdk, react, providers)
```bash
pnpm build          # tsup build
pnpm dev            # tsup --watch
pnpm lint           # eslint src/
pnpm test           # vitest run
pnpm test:coverage  # vitest run --coverage
```

### Demo App (siwETHOS-demo/)
```bash
pnpm dev            # next dev
pnpm build          # next build
pnpm lint           # eslint
```

## Coding Standards

### Naming Conventions
- **Functions:** camelCase (`getUserData`, `calculateTotal`, `fetchEthosProfile`)
- **Classes:** PascalCase (`UserService`, `EthosWalletAuth`, `AuthProvider`)
- **Constants:** UPPER_SNAKE_CASE (`API_KEY`, `MAX_RETRIES`, `DEFAULT_CHAIN_ID`)
- **Types/Interfaces:** PascalCase (`EthosUser`, `WalletAuthConfig`, `AuthResult`)
- **Files:** kebab-case for utilities (`auth-utils.ts`), PascalCase for components (`EthosAuthModal.tsx`)

### Code Style

```typescript
// ✅ Good - descriptive names, proper error handling, typed parameters
async function fetchUserById(id: string): Promise<User> {
  if (!id) throw new Error('User ID required');
  
  const response = await api.get(`/users/${id}`);
  return response.data;
}

// ❌ Bad - vague names, no error handling, implicit any
async function get(x) {
  return await api.get('/users/' + x).data;
}
```

### TypeScript Guidelines
- Enable strict mode (`"strict": true`)
- Avoid `any` - use `unknown` and type guards instead
- Export types alongside implementations
- Use `interface` for object shapes, `type` for unions/intersections
- Prefix unused parameters with underscore: `(_event, data) => {}`

### Testing Conventions
- Use `describe`/`it`/`expect` from Vitest
- Test files: `*.test.ts` or `*.test.tsx`
- Location: `src/__tests__/` or alongside source files
- Coverage thresholds: 80% branches, functions, lines, statements
- Mock external dependencies with `vi.mock()`
- Clean up with `vi.resetAllMocks()` in `beforeEach`

### API Route Conventions (Next.js App Router)
- Export `GET`, `POST`, etc. as named functions
- Use `NextRequest` and `NextResponse`
- Return JSON errors as `{ error: string, error_description: string }`
- Use path aliases: `@/lib/*`, `@/components/*`

## Modularity & Code Organization

### ✅ Mandatory Structure Rules

All new code MUST follow a modular, composable architecture:

**File Size Limits:**
- Single file should not exceed **300 lines** of code
- If a file approaches this limit, split it into logical modules
- `index.ts` files should only contain exports (barrel pattern)

**Module Structure Pattern:**
```
package/src/
├── index.ts           # Barrel exports only (no logic)
├── types.ts           # All interfaces and type definitions
├── constants.ts       # Configuration values and defaults
├── errors.ts          # Custom error classes
├── config.ts          # Configuration management
├── utils/             # Pure utility functions
│   ├── index.ts       # Re-exports
│   └── [feature].ts   # Specific utilities
├── clients/           # Main client classes
│   ├── index.ts       # Re-exports
│   └── [client].ts    # Individual clients
└── [feature]/         # Feature-specific modules
    ├── index.ts
    └── [files].ts
```

**Separation of Concerns:**
- **Types:** All interfaces and types in dedicated `types.ts` files
- **Constants:** All magic values and defaults in `constants.ts`
- **Errors:** Custom error classes in `errors.ts`
- **Config:** Configuration logic in `config.ts`
- **Utilities:** Pure functions (no side effects) in `utils/`
- **Clients/Classes:** Main business logic in `clients/` or feature folders

**Export Guidelines:**
```typescript
// ✅ Good - barrel export pattern
// index.ts
export { EthosAuth, EthosWalletAuth } from './clients';
export { DEFAULTS, ENDPOINTS } from './constants';
export type { EthosUser, AuthResult } from './types';

// ❌ Bad - implementation in index.ts
// index.ts
export class EthosAuth { /* 500 lines of code */ }
```

**Testing Benefits:**
- Each module can be tested in isolation
- Mock dependencies at module boundaries
- Coverage reporting per module
- Easier to maintain test files under 300 lines

### When Refactoring

Before adding new features to an existing file:
1. Check if file exceeds 200 lines → consider splitting first
2. Identify logical boundaries (types, utils, business logic)
3. Extract to new modules with clear single responsibility
4. Update barrel exports in `index.ts`
5. Run tests to verify no regressions

## Global Boundaries

### ✅ Always
- Write TypeScript with proper types
- Run tests before committing (`pnpm test`)
- Follow the existing code patterns in each package
- Use the established error format for APIs
- Add JSDoc comments for public APIs

### ⚠️ Ask First
- Adding new dependencies to `package.json`
- Modifying CI/CD workflows (`.github/workflows/`)
- Database schema changes
- Breaking API changes

### 🚫 Never
- Commit secrets, API keys, or credentials
- Edit `node_modules/`, `dist/`, or `.next/`
- Disable TypeScript strict mode
- Remove existing tests without replacement
- Push directly to `main` branch
