# Sign in with Ethos

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome" />
</p>

Wallet-based authentication for [Ethos Network](https://ethos.network). Let users sign in with their Ethereum wallet and access their on-chain credibility score using [Sign-In with Ethereum (SIWE)](https://login.xyz/).

## Features

- 🔐 **Wallet Authentication** - Sign-In with Ethereum (EIP-4361) standard
- 🦊 **Multi-Wallet Support** - MetaMask, Rabby, Phantom, Zerion, Coinbase, Brave
- 📊 **Credibility Scores** - Access users' Ethos reputation data (0-2800)
- ⚡ **No Gas Fees** - Signature-only verification, no transactions required
- 🚀 **Self-Hostable** - Deploy on Vercel, Docker, or any platform
- 📦 **Framework-Agnostic SDK** - Works with any JavaScript framework

## How It Works

1. **User connects wallet** - Choose from supported wallets (MetaMask, Rabby, etc.)
2. **Sign a message** - No transaction, no gas fees, just a signature to prove ownership
3. **Verify & fetch profile** - Server validates signature and retrieves Ethos profile
4. **Access credibility data** - Get the user's Ethos score and attestations

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────┐
│   Your App      │      │  Auth Server     │      │   Ethos     │
│                 │      │  (this project)  │      │   Network   │
└────────┬────────┘      └────────┬─────────┘      └──────┬──────┘
         │                        │                       │
         │  1. Request nonce      │                       │
         │───────────────────────>│                       │
         │                        │                       │
         │  2. Return nonce       │                       │
         │<───────────────────────│                       │
         │                        │                       │
         │  3. Sign SIWE message  │                       │
         │  (in user's wallet)    │                       │
         │                        │                       │
         │  4. Submit signature   │                       │
         │───────────────────────>│                       │
         │                        │                       │
         │                        │  5. Lookup profile    │
         │                        │──────────────────────>│
         │                        │                       │
         │                        │  6. Profile + score   │
         │                        │<──────────────────────│
         │                        │                       │
         │  7. JWT + user info    │                       │
         │<───────────────────────│                       │
```

## Quick Start

### Using the SDK

```bash
npm install @signinwithethos/js
```

```typescript
import { EthosWalletAuth } from '@signinwithethos/js';

// Initialize
const auth = EthosWalletAuth.init({
  authServerUrl: 'https://ethos.thebbz.xyz'
});

// With wagmi/viem
import { useSignMessage, useAccount } from 'wagmi';

function SignInButton() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const handleSignIn = async () => {
    const result = await auth.signIn(address, signMessageAsync);
    
    console.log(result.user.ethosScore);      // Credibility score (0-2800)
    console.log(result.user.ethosUsername);   // Ethos username
    console.log(result.user.walletAddress);   // Verified wallet
  };

  return <button onClick={handleSignIn}>Sign in with Ethos</button>;
}
```

### Self-Hosting

#### Option 1: Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/thebbz/signinwithethos)

#### Option 2: Docker

```bash
git clone https://github.com/thebbz/signinwithethos.git
cd signinwithethos
cp .env.example .env
# Edit .env with your credentials
docker-compose up -d
```

## Configuration

Copy `.env.example` to `.env` and configure:

```env
# Server URL
AUTH_SERVER_URL=https://your-domain.com

# JWT Secret (generate a strong random string)
JWT_SECRET=your-secret-key

# Storage (upstash for serverless, redis for docker)
STORAGE_ADAPTER=upstash
UPSTASH_REDIS_REST_URL=your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/nonce` | GET | Get nonce for SIWE message |
| `/api/auth/wallet/verify` | POST | Verify wallet signature |
| `/api/userinfo` | GET | Get authenticated user profile |
| `/api/token` | POST | Exchange auth code for JWT |

## User Data

The authenticated user object includes:

```json
{
  "sub": "ethos:12345",
  "name": "username",
  "picture": "https://...",
  "ethosProfileId": 12345,
  "ethosUsername": "username",
  "ethosScore": 1847,
  "ethosStatus": "ACTIVE",
  "ethosAttestations": ["x.com:handle", "discord:id"],
  "authMethod": "wallet",
  "walletAddress": "0x..."
}
```

## Security

- **No transactions** - Only message signatures, never moves funds
- **Nonce protection** - Prevents replay attacks
- **Message expiration** - SIWE messages expire after 5 minutes
- **Cryptographic verification** - Signature validated on-chain

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## Documentation

- [SDK Usage Guide](docs/sdk-usage.md) - Integration examples
- [Self-Hosting Guide](docs/self-hosting.md) - Deployment options

## Project Structure

```
signinwithethos/
├── apps/
│   └── server/              # Next.js auth server
│       └── src/
│           ├── app/         # Pages and API routes
│           ├── components/  # React components (modal, hooks)
│           └── lib/         # SIWE verification, Ethos API
├── packages/
│   ├── providers/           # SIWE utilities
│   └── sdk/                 # JavaScript SDK
├── docs/                    # Documentation
├── docker-compose.yml
├── Dockerfile
└── vercel.json
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

MIT - see [LICENSE](LICENSE)

## Links

- [Ethos Network](https://ethos.network)
- [Ethos API Docs](https://developers.ethos.network)
- [Sign-In with Ethereum](https://login.xyz)
- [EIP-4361 Specification](https://eips.ethereum.org/EIPS/eip-4361)
