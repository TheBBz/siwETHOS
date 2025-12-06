# @thebbz/siwe-ethos-providers

SIWE (Sign-In with Ethereum) authentication utilities and Ethos API client for Sign in with Ethos.

This package provides server-side utilities for the Sign in with Ethos authentication system. For client-side integration, use [`@thebbz/siwe-ethos`](https://www.npmjs.com/package/@thebbz/siwe-ethos).

## Installation

```bash
npm install @thebbz/siwe-ethos-providers
```

## Features

- **Ethos API Client** - Fetch profiles and scores from Ethos Network
- **SIWE** - Message creation, parsing, and verification (EIP-4361)
- **Score Validation** - Enforce minimum reputation requirements
- **OAuth Providers** - Discord, Telegram, Farcaster integrations
- **Nonce Management** - Generation and validation utilities

## Ethos API Client

Fetch Ethos profiles and credibility scores directly from the Ethos Network API.

```typescript
import {
  fetchEthosProfile,
  fetchEthosScore,
  getProfileByAddress,
  getScoreByAddress,
} from '@thebbz/siwe-ethos-providers';

// Fetch full profile by Ethereum address
const profile = await fetchEthosProfile('address', '0x1234...5678');
console.log(profile.score); // 1850
console.log(profile.displayName); // "Username"

// Quick score check (doesn't throw on not found)
const { score, ok } = await fetchEthosScore('address', '0x1234...5678');
if (ok && score >= 500) {
  console.log('User has good reputation!');
}

// Convenience functions
const twitterProfile = await fetchEthosProfile('twitter', 'vitalikbuterin');
const discordProfile = await fetchEthosProfile('discord', '123456789');
const farcasterProfile = await fetchEthosProfile('farcaster', '3');

// Or use the helper functions
const profile = await getProfileByAddress('0x1234...5678');
const result = await getScoreByAddress('0x1234...5678');
```

### Available Lookup Types

- `address` - Ethereum wallet address
- `twitter` / `x` - Twitter/X username
- `discord` - Discord user ID
- `farcaster` - Farcaster FID
- `telegram` - Telegram user ID
- `profile-id` - Ethos profile ID

## Score Validation

Validate user reputation scores meet minimum requirements.

```typescript
import {
  validateMinScore,
  meetsMinScore,
  getScoreTier,
  SCORE_TIERS,
} from '@thebbz/siwe-ethos-providers';

// Throws EthosScoreInsufficientError if score is below minimum
validateMinScore(user, 500);

// Boolean check (doesn't throw)
if (!meetsMinScore(user.score, 500)) {
  return res.status(403).json({ error: 'insufficient_score' });
}

// Get user's score tier
const tier = getScoreTier(1850); // 'trusted'
// SCORE_TIERS: untrusted (0-499), neutral (500-999), 
//              reputable (1000-1499), trusted (1500-1999), exemplary (2000+)
```

## SIWE (Sign-In with Ethereum)

```typescript
import {
  createSIWEMessage,
  formatSIWEMessage,
  verifySIWEMessage,
  generateNonce,
} from '@thebbz/siwe-ethos-providers';

// Create a SIWE message
const message = createSIWEMessage({
  domain: 'example.com',
  address: '0x1234...5678',
  uri: 'https://example.com',
  nonce: generateNonce(),
  chainId: 1,
});

// Format for signing
const messageString = formatSIWEMessage(message);

// Verify a signed message
const result = await verifySIWEMessage({
  message: messageString,
  signature: '0x...',
  address: '0x1234...5678',
});
```

## OAuth Providers

```typescript
import {
  DiscordProvider,
  TelegramProvider,
  FarcasterProvider,
} from '@thebbz/siwe-ethos-providers';

// Discord OAuth
const discord = new DiscordProvider({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  redirectUri: 'https://example.com/callback',
});

// Telegram Login
const telegram = new TelegramProvider({
  botToken: 'your-bot-token',
});

// Farcaster SIWF
const farcaster = new FarcasterProvider({
  domain: 'example.com',
});
```

## API Reference

### Ethos API

| Function | Description |
|----------|-------------|
| `fetchEthosProfile(type, identifier)` | Fetch full Ethos profile |
| `fetchEthosScore(type, identifier)` | Get score (returns `{ score, ok }`) |
| `getProfileByAddress(address)` | Fetch by Ethereum address |
| `getProfileByTwitter(username)` | Fetch by Twitter username |
| `getProfileByDiscord(id)` | Fetch by Discord ID |
| `getProfileByFarcaster(fid)` | Fetch by Farcaster FID |
| `getProfileByTelegram(id)` | Fetch by Telegram ID |
| `getProfileById(profileId)` | Fetch by Ethos profile ID |
| `getScoreByAddress(address)` | Get score by address |

### Score Validation

| Function | Description |
|----------|-------------|
| `validateMinScore(user, minScore)` | Validate score (throws on failure) |
| `meetsMinScore(score, minScore)` | Boolean score check |
| `getScoreTier(score)` | Get tier name for score |

### SIWE Functions

| Function | Description |
|----------|-------------|
| `createSIWEMessage(params)` | Create SIWE message object |
| `formatSIWEMessage(message)` | Format for wallet signing |
| `parseSIWEMessage(string)` | Parse formatted message |
| `verifySIWEMessage(params)` | Verify signed message |
| `generateNonce()` | Generate cryptographic nonce |

## Related

- [@thebbz/siwe-ethos](https://www.npmjs.com/package/@thebbz/siwe-ethos) - Client SDK
- [@thebbz/siwe-ethos-react](https://www.npmjs.com/package/@thebbz/siwe-ethos-react) - React components
- [Sign in with Ethos](https://github.com/thebbz/siwETHOS) - Full project

## License

MIT

