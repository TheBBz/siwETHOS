# Self-Hosting Guide

This guide covers deploying your own instance of Sign in with Ethos.

> **Note:** For the demo server, visit [ethos.thebbz.xyz](https://ethos.thebbz.xyz). The source code for the demo is available at [github.com/TheBBz/siwETHOS-demo](https://github.com/TheBBz/siwETHOS-demo).

## Prerequisites

- Node.js 18+ or Docker
- (For serverless) Upstash Redis account
- (For Docker) Redis instance

## Deployment Options

### Option 1: Vercel (Recommended for Serverless)

The easiest way to deploy is using Vercel:

1. **Fork the demo repository**
   ```bash
   git clone https://github.com/TheBBz/siwETHOS-demo.git
   cd siwETHOS-demo
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your forked repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**
   
   In Vercel dashboard → Settings → Environment Variables:

   | Variable | Description |
   |----------|-------------|
   | `AUTH_SERVER_URL` | Your Vercel domain (e.g., `https://ethos-auth.vercel.app`) |
   | `JWT_SECRET` | Strong random string for signing JWTs |
   | `STORAGE_ADAPTER` | Set to `upstash` |
   | `UPSTASH_REDIS_REST_URL` | From Upstash dashboard |
   | `UPSTASH_REDIS_REST_TOKEN` | From Upstash dashboard |
   | `SIWE_DOMAIN` | Your domain for SIWE messages |
   | `SIWE_NONCE_EXPIRY` | Nonce expiry in seconds (default: 300) |

   | `TELEGRAM_BOT_USERNAME` | If using Telegram | - | Telegram bot username |
   | `TELEGRAM_BOT_TOKEN` | If using Telegram | - | Telegram bot token from BotFather |
   | `DISCORD_CLIENT_ID` | If using Discord | - | Discord OAuth client ID |
   | `DISCORD_CLIENT_SECRET` | If using Discord | - | Discord OAuth client secret |

4. **Set up Upstash Redis**
   - Go to [upstash.com](https://upstash.com)
   - Create a new Redis database
   - Copy the REST URL and token

5. **Deploy**
   - Vercel will automatically deploy on push to main

### Option 2: Docker

For self-hosted deployments with Docker:

1. **Clone the demo repository**
   ```bash
   git clone https://github.com/TheBBz/siwETHOS-demo.git
   cd siwETHOS-demo
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

   This starts:
   - The auth server on port 3000
   - Redis for nonce storage on port 6379

4. **Configure reverse proxy (recommended)**
   
   Use nginx or Caddy for HTTPS:

   ```nginx
   # /etc/nginx/sites-available/ethos-auth
   server {
       listen 443 ssl;
       server_name auth.yourdomain.com;

       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;

       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

### Option 3: Manual Deployment

For other platforms (Railway, Render, DigitalOcean, etc.):

1. **Build the project**
   ```bash
   pnpm install
   pnpm build
   ```

2. **Set environment variables** (see table above)

3. **Start the server**
   ```bash
   pnpm start
   ```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AUTH_SERVER_URL` | Yes | - | Public URL of your auth server |
| `JWT_SECRET` | Yes | - | Secret for signing JWT tokens |
| `STORAGE_ADAPTER` | No | `memory` | Storage backend: `memory`, `redis`, or `upstash` |
| `UPSTASH_REDIS_REST_URL` | If upstash | - | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | If upstash | - | Upstash Redis REST token |
| `REDIS_URL` | If redis | - | Redis connection URL |
| `SIWE_DOMAIN` | No | `AUTH_SERVER_URL` | Domain for SIWE messages |
| `SIWE_NONCE_EXPIRY` | No | `300` | Nonce expiry in seconds |
| `SIWE_STATEMENT` | No | See default | Custom statement for SIWE messages |

## API Endpoints

Your self-hosted instance will expose these endpoints:

### GET `/api/auth/nonce`

Get a fresh nonce for SIWE message construction.

```bash
curl https://your-domain.com/api/auth/nonce
```

Response:
```json
{
  "nonce": "abc123...",
  "expiresAt": "2025-12-05T12:05:00.000Z"
}
```

### POST `/api/auth/wallet/verify`

Verify a signed SIWE message and get user data.

```bash
curl -X POST https://your-domain.com/api/auth/wallet/verify \
  -H "Content-Type: application/json" \
  -d '{
    "message": "...",
    "signature": "0x...",
    "address": "0x..."
  }'
```

Response:
```json
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "user": {
    "sub": "ethos:12345",
    "name": "username",
    "ethosScore": 1500,
    "walletAddress": "0x..."
  }
}
```

### GET `/api/userinfo`

Get user information from a valid access token.

```bash
curl https://your-domain.com/api/userinfo \
  -H "Authorization: Bearer eyJ..."
```

## Custom Domain

1. Add your domain in Vercel/your hosting provider
2. Update `AUTH_SERVER_URL` to your custom domain
3. Update `SIWE_DOMAIN` if different from `AUTH_SERVER_URL`
4. Ensure DNS records point to your deployment

## Security Considerations

1. **Use HTTPS** - Always deploy with TLS/SSL. SIWE requires secure connections.

2. **Strong JWT secret** - Use at least 32 random characters:
   ```bash
   openssl rand -base64 32
   ```

3. **Secure Redis** - Use authentication for Redis in production

4. **Rate limiting** - Consider adding rate limiting for auth endpoints to prevent abuse

5. **Nonce expiry** - Keep nonce expiry short (5 minutes default) to prevent replay attacks

## Monitoring

Check application health:

```bash
curl https://your-domain.com/api/health
```

View logs:
- **Vercel**: Functions tab in dashboard
- **Docker**: `docker-compose logs -f`

## Troubleshooting

### "Invalid signature"
- Ensure the message being signed matches exactly what was constructed
- Check that the address matches the signer

### "Nonce expired"
- The sign-in flow took too long
- Request a new nonce and try again
- Consider increasing `SIWE_NONCE_EXPIRY` if users consistently experience this

### "No Ethos profile found"
- User needs to create an Ethos profile at [ethos.network](https://ethos.network)
- The wallet address must be linked to their Ethos profile

### Redis connection errors
- Verify Redis URL/credentials
- Check network connectivity to Redis
- For Upstash, ensure the REST URL and token are correct

### JWT verification failures
- Ensure `JWT_SECRET` is the same across all instances
- Check that tokens haven't expired
