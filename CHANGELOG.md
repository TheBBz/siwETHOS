# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/thebbz/siwETHOS/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/thebbz/siwETHOS/releases/tag/v1.0.0
