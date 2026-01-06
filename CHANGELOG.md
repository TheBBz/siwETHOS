# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2026-01-06

### Added

#### Server Middleware (`@thebbz/siwe-ethos-server`) - NEW PACKAGE
- Express.js middleware with `ethosAuthMiddleware()` and `requireAuth()`
- Next.js middleware with `withEthosAuth()` and `withOptionalEthosAuth()`
- `requireMinScore(score)` middleware for score-gated access
- JWT decoder and verifier with JWKS support
- TypeScript types: `EthosAuthUser`, `EthosMiddlewareConfig`, `EthosJWTPayload`

#### WebAuthn/Passkeys (`@thebbz/siwe-ethos-providers`)
- `verifyRegistration()` - Verify WebAuthn registration credentials
- `verifyAuthentication()` - Verify WebAuthn authentication assertions
- `generateChallenge()` and `storeChallenge()` - Challenge management
- Full FIDO2/WebAuthn server-side verification support

#### React (`@thebbz/siwe-ethos-react`)
- **PasskeyView component** - Passwordless auth with Face ID, Touch ID, Windows Hello
  - Sign-in flow for existing passkeys
  - Registration flow for new passkeys
  - Add passkey flow for existing accounts
- **TelegramWidgetView component** - Embedded Telegram Login Widget
- New modal props: `showPasskey`, `telegramBotUsername`, `termsUrl`, `privacyUrl`
- `'passkey'` added to `authMethod` type

#### SDK (`@thebbz/siwe-ethos`)
- WebAuthn methods:
  - `getWebAuthnRegistrationOptions(username)` - Get registration options
  - `verifyWebAuthnRegistration(credential)` - Verify registration
  - `getWebAuthnAuthenticationOptions()` - Get authentication options
  - `verifyWebAuthnAuthentication(credential)` - Verify authentication
- WebAuthn endpoints added to SDK constants
- WebAuthn types exported

#### Providers (`@thebbz/siwe-ethos-providers`)
- **GitHub OAuth provider** with `getAuthorizationUrl()`, `handleCallback()`, `getEthosLookup()`
- **Profile enrichment utilities**:
  - `getLinkedAccounts()` - Get normalized linked accounts
  - `getProfileStats()` - Get aggregated profile stats
  - `hasAttestation()` - Check for service attestation
  - `weiToEth()` - Convert Wei to ETH
- GitHub provider exported from package

### Changed
- Score tiers aligned with Ethos API v2 (0-2800 scale)
- Discord provider now returns `{ url, state }` instead of string for CSRF protection
- Telegram provider default `maxAge` reduced from 86400s (24h) to 300s (5min)

### Security
- **Discord OAuth**: Auto-generate cryptographic state parameter for CSRF protection
- **Telegram**: Reduced maxAge to 5 minutes to limit replay attack window
- Added `qs>=6.14.1` override to fix CVE-2025-15284 (DoS via prototype pollution)

### Breaking Changes
- `DiscordProvider.getAuthorizationUrl()` now returns `{ url: string; state: string }` instead of `string`

## [1.3.0] - 2025-12-07

### Added

#### SDK (`@thebbz/siwe-ethos`)
- **Session Management Module**
  - `SessionManager` class with automatic token refresh
  - `BrowserStorage` adapter for localStorage persistence
  - `MemoryStorage` adapter for in-memory sessions
  - `createStorage()` factory function
  - Auth state change listeners via `onAuthStateChange()`
  - Configurable refresh threshold and auto-refresh
- **Modular Architecture Refactor**
  - Split 1179-line monolith into modular structure
  - Types in `types.ts`, constants in `constants.ts`
  - Error classes in `errors.ts`, config in `config.ts`
  - Utility functions in `utils/` directory
  - Client classes in `clients/` directory
  - Session management in `session/` directory
- Added `profileUrl` field to `EthosUser` interface

#### React (`@thebbz/siwe-ethos-react`)
- **EthosAuthProvider Context**
  - Centralized session management for React apps
  - Configurable storage type (browser/memory)
  - Auto-refresh token support
  - Auth state change callbacks
- **Session Hooks**
  - `useEthosSession()` - Full session control (login, logout, refresh)
  - `useEthosUser()` - User data with loading states
  - `useEthosScore()` - Score with tier calculation and colors
  - `useMinScore(minScore)` - Score-gated access checks
  - `useIsAuthenticated()` - Simple auth status
  - `useAccessToken()` - Current access token
  - `useIsInsideEthosProvider()` - Provider detection
- 18 new tests for context and hooks

### Changed
- SDK files now follow 300-line limit modularity rule
- Improved code organization and maintainability

## [1.2.0] - 2025-12-06

### Added
- Ethos API Client in `@thebbz/siwe-ethos-providers`
  - `fetchEthosProfile(type, identifier)` - Fetch full Ethos profile
  - `fetchEthosScore(type, identifier)` - Get score with `{ score, ok }` result
  - `getProfileByAddress(address)` - Fetch by Ethereum address
  - `getProfileByTwitter(username)` - Fetch by Twitter/X username
  - `getProfileByDiscord(id)` - Fetch by Discord user ID
  - `getProfileByFarcaster(fid)` - Fetch by Farcaster FID
  - `getProfileByTelegram(id)` - Fetch by Telegram user ID
  - `getProfileById(profileId)` - Fetch by Ethos profile ID
  - `getScoreByAddress(address)` - Quick score check by address
- Re-exported Ethos API functions from `@thebbz/siwe-ethos` SDK
- Re-exported score validation utilities (`validateMinScore`, `meetsMinScore`, `getScoreTier`) from SDK
- `EthosProfileNotFoundError` and `EthosApiError` error classes
- Comprehensive test coverage for Ethos API client (19 new tests)
- Updated README documentation for both packages

### Changed
- SDK now depends on `@thebbz/siwe-ethos-providers` for shared utilities

## [1.1.0] - 2025-12-05

### Added
- React components package (`@thebbz/siwe-ethos-react`) v1.0.0
- Sign-in modal with wallet and social authentication
- Farcaster QR code authentication flow
- Discord, Twitter, and Telegram OAuth support
- Sign out animation and flow
- UTF-8 emoji support in OAuth callbacks
- Official Ethos favicon and brand identity
- Improved landing page with step-by-step integration guide
- Official wallet connector logos (MetaMask, Rabby, Phantom, Zerion, Coinbase, Brave)
- Open Graph and Twitter card metadata
- `CODE_OF_CONDUCT.md` (Contributor Covenant)
- `SECURITY.md` with vulnerability reporting guidelines
- GitHub issue and PR templates

### Changed
- Improved OAuth callback handling with proper base64url decoding
- Enhanced error handling across all authentication flows
- Updated brand colors to official Ethos palette (#2E7BC3 primary)
- Improved Quick Start documentation with clearer examples
- Unified color scheme across all components

### Fixed
- Fixed ESLint unused variable warnings in SDK and React packages
- Updated documentation dates to 2025
- Fixed copyright year in LICENSE
- Added ESLint configuration to React package
- Fixed TypeScript type annotations for better lint compliance
- Converted deprecated empty interface to type alias (WalletAuthResult)
- Updated example timestamps in documentation to current date

## [1.0.0] - 2025-12-05

### Added
- Initial release of Sign in with Ethos
- Wallet-based authentication using SIWE (EIP-4361)
- Support for multiple wallets: MetaMask, Rabby, Phantom, Zerion, Coinbase, Brave
- Ethos profile integration with credibility scores
- REST API endpoints for authentication
- JavaScript/TypeScript SDK (`@thebbz/siwe-ethos`)
- Provider utilities package (`@thebbz/siwe-ethos-providers`)
- Docker support for self-hosting
- Vercel deployment configuration
- Comprehensive documentation

### Security
- Nonce-based replay protection
- Message expiration for SIWE
- Secure session handling

[1.4.0]: https://github.com/thebbz/siwETHOS/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/thebbz/siwETHOS/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/thebbz/siwETHOS/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/thebbz/siwETHOS/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/thebbz/siwETHOS/releases/tag/v1.0.0
