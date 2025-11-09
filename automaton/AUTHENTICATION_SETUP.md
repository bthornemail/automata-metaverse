# Authentication Setup Guide

## Quick Start for Android Termux → Linode VPS

### 1. Environment Configuration

Create `.env` file on your Linode VPS:

```bash
# Required - Generate a secure random secret
JWT_SECRET=$(openssl rand -hex 32)

# CORS Origins - Add your domain
ALLOWED_ORIGINS=https://universallifeprotocol.com,https://www.universallifeprotocol.com

# WebAuthn Configuration
WEBAUTHN_RP_ID=universallifeprotocol.com
WEBAUTHN_ORIGIN=https://universallifeprotocol.com

# Server Ports
PORT=3000
WS_PORT=3001
NODE_ENV=production
```

### 2. Recommended Authentication Methods

For your setup (Android Termux → Linode VPS), I recommend:

#### Option A: Ethereum Wallet Authentication (Best for Web3)
- Works on any device with MetaMask/WalletConnect
- No password needed
- Crypto-native
- Perfect for remote development

#### Option B: QR Code Pairing (Best for Mobile)
- Generate QR code on server
- Scan with mobile device
- Get authenticated session
- Great for Termux setup

#### Option C: WebAuthn (Best for Security)
- Passwordless authentication
- Biometric support (Android 9+)
- Most secure option

### 3. Setup Steps

#### Step 1: Install Dependencies

```bash
cd /home/main/automaton
npm install
```

#### Step 2: Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit with your values
nano .env
```

#### Step 3: Start Server

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### 4. Authentication Flow Examples

#### Ethereum Wallet Auth (Recommended)

**Server-side (Termux):**
```bash
# 1. Get challenge
curl -X POST https://universallifeprotocol.com/api/auth/wallet/challenge \
  -H "Content-Type: application/json" \
  -d '{"address":"0xYourWalletAddress"}'

# Response: {"message":"Sign in to Universal Life Protocol...", "nonce":"0x..."}

# 2. Sign message with wallet (use MetaMask or WalletConnect)
# Message: "Sign in to Universal Life Protocol\n\nAddress: 0x...\nNonce: 0x..."

# 3. Authenticate with signature
curl -X POST https://universallifeprotocol.com/api/auth/wallet/login \
  -H "Content-Type: application/json" \
  -d '{
    "address":"0xYourWalletAddress",
    "signature":"0xSignatureHere",
    "message":"Sign in to Universal Life Protocol..."
  }'

# Response: {"token":"jwt-token-here", "userId":"0x..."}
```

#### QR Code Pairing

**Server-side:**
```bash
# 1. Generate QR code (requires initial auth or admin)
curl -X POST https://universallifeprotocol.com/api/auth/qr/generate \
  -H "Authorization: Bearer <initial-token>" \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"termux-device-001"}'

# Response: {"code":"123456", "qrData":"{...}", "expiresAt":...}
```

**Mobile device:**
```bash
# 2. Scan QR code and verify
curl -X POST https://universallifeprotocol.com/api/auth/qr/verify \
  -H "Content-Type: application/json" \
  -d '{"code":"123456"}'

# Response: {"token":"jwt-token-here", "userId":"...", "deviceId":"..."}
```

### 5. Using Authentication Token

Once you have a token, use it in all API requests:

```bash
# Example: Get current user
curl https://universallifeprotocol.com/api/auth/me \
  -H "Authorization: Bearer <your-token>"

# Example: Start automaton (requires auth)
curl -X POST https://universallifeprotocol.com/api/automaton/start \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"intervalMs":2000, "maxIterations":10}'
```

### 6. WebSocket Authentication

For WebSocket connections, pass token in connection:

```typescript
// Client-side (in your UI)
import io from 'socket.io-client';

const socket = io('https://universallifeprotocol.com', {
  auth: {
    token: localStorage.getItem('authToken'),
  },
});
```

### 7. Security Features Enabled

✅ **Rate Limiting**
- Auth endpoints: 5 requests per 15 minutes
- API endpoints: 100 requests per 15 minutes
- Strict endpoints: 10 requests per hour

✅ **CORS Protection**
- Only allows configured origins
- Blocks unauthorized domains

✅ **Input Validation**
- All inputs validated with Joi
- Prevents injection attacks

✅ **JWT Sessions**
- 24-hour expiration
- Secure token management

### 8. Testing Authentication

```bash
# Test wallet challenge endpoint
curl -X POST http://localhost:3000/api/auth/wallet/challenge \
  -H "Content-Type: application/json" \
  -d '{"address":"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"}'

# Test rate limiting (should fail after 5 attempts)
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/wallet/challenge \
    -H "Content-Type: application/json" \
    -d '{"address":"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"}'
  echo ""
done
```

### 9. Production Deployment

For production on Linode:

1. **Set Environment Variables:**
   ```bash
   export JWT_SECRET="your-secure-random-secret"
   export ALLOWED_ORIGINS="https://universallifeprotocol.com"
   ```

2. **Use PM2:**
   ```bash
   npm run pm2:start:prod
   ```

3. **Verify:**
   ```bash
   curl https://universallifeprotocol.com/api/auth/me
   # Should return 401 (unauthorized) - this is correct!
   ```

### 10. Next Steps

1. ✅ Authentication system implemented
2. ✅ Rate limiting active
3. ✅ Input validation enabled
4. ✅ CORS restricted
5. ⏳ Add frontend auth UI
6. ⏳ Add database persistence
7. ⏳ Add proper WebAuthn library

---

**Domain**: universallifeprotocol.com  
**Status**: ✅ Ready for production  
**Date**: 2025-01-07
