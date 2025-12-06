# Sign in with Ethos

<p align="center">
  <a href="https://www.npmjs.com/package/@thebbz/siwe-ethos"><img src="https://img.shields.io/npm/v/@thebbz/siwe-ethos.svg" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@thebbz/siwe-ethos-react"><img src="https://img.shields.io/npm/v/@thebbz/siwe-ethos-react.svg?label=react" alt="react version" /></a>
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome" />
</p>

<p align="center">
  <a href="https://ethos.thebbz.xyz">Live Demo</a> •
  <a href="https://www.npmjs.com/package/@thebbz/siwe-ethos">SDK</a> •
  <a href="https://www.npmjs.com/package/@thebbz/siwe-ethos-react">React</a> •
  <a href="docs/self-hosting.md">Self-Hosting</a>
</p>

Wallet-based authentication for [Ethos Network](https://ethos.network). Let users sign in with their Ethereum wallet or social accounts and access their on-chain credibility score.

## Features

- 🔐 **Wallet Authentication** - Sign-In with Ethereum (EIP-4361) standard
- 🦊 **Multi-Wallet Support** - MetaMask, Rabby, Phantom, Zerion, Coinbase, Brave
- 🌐 **Social Logins** - Farcaster (QR code), Discord, Twitter/X, Telegram
- 📊 **Credibility Scores** - Access users' Ethos reputation data (0-2800)
- 🔍 **Profile Lookup** - Fetch any Ethos profile by address, social handle, or ID
- ⚛️ **React Components** - Beautiful, animated auth modal with dark mode
- ⚡ **No Gas Fees** - Signature-only verification, no transactions required
- 🚀 **Self-Hostable** - Deploy on Vercel, Docker, or any platform
- 📦 **Framework-Agnostic SDK** - Works with any JavaScript framework

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`@thebbz/siwe-ethos`](https://www.npmjs.com/package/@thebbz/siwe-ethos) | [![npm](https://img.shields.io/npm/v/@thebbz/siwe-ethos.svg)](https://www.npmjs.com/package/@thebbz/siwe-ethos) | Core SDK for authentication |
| [`@thebbz/siwe-ethos-react`](https://www.npmjs.com/package/@thebbz/siwe-ethos-react) | [![npm](https://img.shields.io/npm/v/@thebbz/siwe-ethos-react.svg)](https://www.npmjs.com/package/@thebbz/siwe-ethos-react) | React components & modal |
| [`@thebbz/siwe-ethos-providers`](https://www.npmjs.com/package/@thebbz/siwe-ethos-providers) | [![npm](https://img.shields.io/npm/v/@thebbz/siwe-ethos-providers.svg)](https://www.npmjs.com/package/@thebbz/siwe-ethos-providers) | Server-side SIWE utilities |

## How It Works

Users can authenticate via **wallet signature** or **social OAuth**:

### Wallet Authentication
1. **User connects wallet** - Choose from supported wallets (MetaMask, Rabby, etc.)
2. **Sign a message** - No transaction, no gas fees, just a signature to prove ownership
3. **Verify & fetch profile** - Server validates signature and retrieves Ethos profile
4. **Access credibility data** - Get the user's Ethos score and attestations

### Social Authentication
1. **User selects provider** - Farcaster, Discord, Twitter/X, or Telegram
2. **OAuth flow** - Redirects to provider for authentication
3. **Link to Ethos** - Server looks up the Ethos profile linked to that social account
4. **Access credibility data** - Get the user's Ethos score and attestations

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────┐
│   Your App      │      │  Auth Server     │      │   Ethos     │
│                 │      │  (this project)  │      │   Network   │
└────────┬────────┘      └────────┬─────────┘      └──────┬──────┘
         │                        │                       │
         │ Wallet: Sign SIWE msg  │                       │
         │ Social: OAuth redirect │                       │
         │───────────────────────>│                       │
         │                        │                       │
         │                        │  Lookup by address    │
         │                        │  or social handle     │
         │                        │──────────────────────>│
         │                        │                       │
         │                        │  Profile + score      │
         │                        │<──────────────────────│
         │                        │                       │
         │  JWT + user info       │                       │
         │<───────────────────────│                       │
```

## Quick Start

### Option 1: React Components (Easiest)

```bash
npm install @thebbz/siwe-ethos-react
```

```tsx
import { useState } from 'react';
import { EthosAuthModal, EthosAuthResult } from '@thebbz/siwe-ethos-react';

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<EthosAuthResult | null>(null);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        {user ? `Hello, ${user.profile.displayName}` : 'Sign in with Ethos'}
      </button>

      <EthosAuthModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={(result) => {
          setUser(result);
          setIsOpen(false);
          console.log('Score:', result.profile.score); // Credibility score (0-2800)
        }}
      />
    </>
  );
}
```

### Option 2: Using the SDK

```bash
npm install @thebbz/siwe-ethos
```

```typescript
import { EthosWalletAuth } from '@thebbz/siwe-ethos';

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

### Option 3: Fetch Profiles Directly (No Auth)

Look up any Ethos profile without requiring user authentication:

```typescript
import { 
  fetchEthosProfile, 
  getScoreByAddress,
  getProfileByTwitter,
  getProfileByFarcaster 
} from '@thebbz/siwe-ethos';

// By wallet address
const profile = await fetchEthosProfile('address', '0x1234...');
console.log(profile.score);        // 1847
console.log(profile.displayName);  // "vitalik.eth"

// Quick score check
const { score, ok } = await getScoreByAddress('0x1234...');
if (ok) console.log(`Score: ${score}`);

// By social handles
const twitterProfile = await getProfileByTwitter('VitalikButerin');
const farcasterProfile = await getProfileByFarcaster('3');  // FID
```

### Option 4: Self-Hosting

#### Option 1: Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/thebbz/siwETHOS)

#### Option 2: Docker

```bash
git clone https://github.com/thebbz/siwETHOS.git
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

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/nonce` | GET | Get nonce for SIWE message |
| `/api/auth/wallet/verify` | POST | Verify wallet signature |
| `/api/auth/farcaster` | GET | Start Farcaster OAuth flow |
| `/api/auth/discord` | GET | Start Discord OAuth flow |
| `/api/auth/twitter` | GET | Start Twitter OAuth flow |
| `/api/auth/telegram` | GET | Start Telegram OAuth flow |

### OAuth
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/authorize` | GET | OAuth 2.0 authorization |
| `/api/token` | POST | Exchange auth code for JWT |
| `/api/userinfo` | GET | Get authenticated user profile |

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
  "ethosAttestations": ["x.com:handle", "discord:id", "farcaster:fid"],
  "authMethod": "wallet",
  "walletAddress": "0x..."
}
```

The `authMethod` field indicates how the user authenticated:
- `wallet` - Signed in with Ethereum wallet (SIWE)
- `farcaster` - Signed in via Farcaster
- `discord` - Signed in via Discord
- `twitter` - Signed in via Twitter/X
- `telegram` - Signed in via Telegram

## Security

- **No transactions** - Only message signatures, never moves funds
- **Nonce protection** - Prevents replay attacks
- **Message expiration** - SIWE messages expire after 5 minutes
- **Cryptographic verification** - Signature validated on-chain

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## Documentation

- [SDK Usage Guide](docs/sdk-usage.md) - Core SDK integration
- [React Components Guide](docs/react-components.md) - React modal & hooks
- [Self-Hosting Guide](docs/self-hosting.md) - Deploy your own instance

## Project Structure

```
signinwithethos/
├── packages/
│   ├── sdk/                 # @thebbz/siwe-ethos - Client SDK
│   ├── react/               # @thebbz/siwe-ethos-react - React components
│   └── providers/           # @thebbz/siwe-ethos-providers - SIWE utilities
├── docs/                    # Documentation
│   ├── sdk-usage.md         # SDK integration guide
│   └── self-hosting.md      # Deployment options
└── README.md
```

The demo app is hosted separately at [siwETHOS-demo](https://github.com/TheBBz/siwETHOS-demo).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

MIT - see [LICENSE](LICENSE)

## Links

- [Live Demo](https://ethos.thebbz.xyz) - Try the authentication flow
- [GitHub Repository](https://github.com/TheBBz/siwETHOS)
- [npm: @thebbz/siwe-ethos](https://www.npmjs.com/package/@thebbz/siwe-ethos)
- [npm: @thebbz/siwe-ethos-react](https://www.npmjs.com/package/@thebbz/siwe-ethos-react)
- [npm: @thebbz/siwe-ethos-providers](https://www.npmjs.com/package/@thebbz/siwe-ethos-providers)
- [Ethos Network](https://ethos.network)
- [Ethos API Docs](https://developers.ethos.network)
- [Sign-In with Ethereum](https://login.xyz)
- [EIP-4361 Specification](https://eips.ethereum.org/EIPS/eip-4361)
