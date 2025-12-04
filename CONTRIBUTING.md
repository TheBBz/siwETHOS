# Contributing to Sign in with Ethos

Thank you for your interest in contributing to Sign in with Ethos! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm 8+
- Git

### Getting Started

1. Fork and clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/signinwithethos.git
cd signinwithethos
```

2. Install dependencies:
```bash
pnpm install
```

3. Copy the example environment file:
```bash
cp .env.example .env
```

4. Configure your environment variables (see [Self-Hosting Guide](docs/self-hosting.md))

5. Start the development server:
```bash
pnpm dev
```

### Project Structure

```
signinwithethos/
├── apps/
│   └── server/          # Next.js authentication server
├── packages/
│   ├── providers/       # SIWE provider utilities
│   └── sdk/             # JavaScript SDK
└── docs/                # Documentation
```

## Making Changes

### Branching

- Create a feature branch from `main`:
```bash
git checkout -b feature/your-feature-name
```

### Code Style

- Use TypeScript for all code
- Follow existing code patterns
- Run `pnpm lint` before committing

### Testing

- Add tests for new features
- Ensure existing tests pass: `pnpm test`

### Commits

- Use clear, descriptive commit messages
- Reference issues when applicable

### Pull Requests

1. Update documentation if needed
2. Ensure all tests pass
3. Describe your changes in the PR description
4. Link related issues

## Adding Wallet Support

To add support for a new wallet:

1. Add the wallet detection logic in `apps/server/src/components/EthosAuthModal.tsx`
2. Add the wallet logo SVG
3. Update the wallet list in the connect modal
4. Test the wallet connection flow

## Reporting Issues

- Use GitHub Issues
- Include reproduction steps
- Specify your environment

## Code of Conduct

Be respectful and inclusive. We follow the [Contributor Covenant](https://www.contributor-covenant.org/).

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
