# AIGENEV7 Security Policy

## Overview

AIGENEV7 takes security seriously. This document outlines the security measures implemented across all components and provides guidance for reporting vulnerabilities.

## Security Architecture

### 1. Web Application Security

#### Content Security Policy (CSP)
All web pages include CSP headers to prevent XSS attacks:
- `default-src 'self'` — Only load resources from same origin
- `script-src 'self'` — No inline scripts allowed
- `style-src 'self' 'unsafe-inline'` — Styles from same origin
- `connect-src 'self' https://api.commerce.coinbase.com` — API calls restricted
- `frame-ancestors 'none'` — Prevents clickjacking

#### Security Headers
Every response includes:
- `X-Content-Type-Options: nosniff` — Prevents MIME type sniffing
- `X-Frame-Options: DENY` — Prevents framing/clickjacking
- `X-XSS-Protection: 1; mode=block` — Enables XSS filtering
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` — Enforces HTTPS
- `Referrer-Policy: strict-origin-when-cross-origin` — Controls referrer information
- `Permissions-Policy: camera=(), microphone=(), geolocation=()` — Restricts browser features

### 2. API Security

#### Rate Limiting
- **Window:** 60 seconds (configurable via `RATE_LIMIT_WINDOW`)
- **Max Requests:** 30 per window per IP (configurable via `RATE_LIMIT_MAX`)
- **Response:** HTTP 429 with `Retry-After` header when exceeded
- **Cleanup:** Automatic cleanup of old entries when store exceeds 1000 entries

#### Input Validation
All API inputs are validated:
- **Tier:** Must be one of `pro`, `elite`, `enterprise`
- **Amount:** Must be a positive number ≤ 10,000
- **Email:** Valid email format, max 254 characters
- **Name:** Max 200 characters
- **Currency:** Must be one of `USD`, `EUR`, `GBP`, `CAD`, `AUD`

#### Input Sanitization
All string inputs are sanitized:
- Removed angle brackets (`<`, `>`)
- Removed `javascript:` protocol
- Removed event handler attributes (`onclick`, `onload`, etc.)
- Trimmed whitespace

### 3. Payment Security

#### Coinbase Commerce Integration
- **API Key:** Stored as Cloudflare Worker secret (never exposed)
- **Webhook Verification:** HMAC-SHA256 signature verification using constant-time comparison
- **Webhook Secret:** Stored as Cloudflare Worker secret
- **Body Size Limit:** 1MB maximum for webhook payloads

#### Signature Verification
```javascript
// Uses crypto.subtle.verify for constant-time comparison
// Prevents timing attacks that could leak signature information
const isValid = await crypto.subtle.verify('HMAC', key, signatureBytes, encoder.encode(rawBody))
```

### 4. CORS Configuration

#### Allowed Origins
Configurable via `ALLOWED_ORIGINS` environment variable:
```
https://constanza8999.github.io,https://aigenev7.com,http://localhost:3000
```

#### CORS Headers
- `Access-Control-Allow-Origin`: Specific origin (not wildcard `*`)
- `Access-Control-Allow-Methods`: `POST, OPTIONS` only
- `Access-Control-Allow-Headers`: `Content-Type` only
- `Access-Control-Max-Age`: 86400 seconds (24 hours)
- `Vary: Origin` — Ensures proper caching

### 5. Data Protection

#### What We Store
- **Payment emails:** Used only for key delivery, not stored permanently
- **Charge IDs:** Used for payment verification only
- **No credit card data:** All payments processed by Coinbase Commerce

#### What We Don't Store
- Credit card numbers
- API keys in logs
- Passwords (no authentication system)
- Personal information beyond email

### 6. Infrastructure Security

#### Cloudflare Workers
- Edge deployment with DDoS protection
- Automatic SSL/TLS termination
- Global CDN with low latency
- Built-in rate limiting (can be configured in dashboard)

#### GitHub Actions
- Secrets stored in GitHub repository secrets
- Tokens have minimal required permissions
- Workflow logs don't expose secrets

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it responsibly:

1. **Email:** constanza@aigen7ev.ai
2. **Subject:** [SECURITY] Vulnerability Report
3. **Include:**
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

**Do NOT** create public GitHub issues for security vulnerabilities.

## Security Checklist

### For Developers
- [ ] Never commit API keys or secrets to git
- [ ] Use environment variables for all sensitive configuration
- [ ] Validate all user inputs on both client and server
- [ ] Use HTTPS for all API calls
- [ ] Implement proper error handling without leaking details
- [ ] Regularly update dependencies

### For Deployment
- [ ] Set all required secrets in Cloudflare Workers
- [ ] Configure allowed origins for CORS
- [ ] Enable rate limiting in Cloudflare dashboard
- [ ] Monitor worker logs for suspicious activity
- [ ] Set up alerts for failed webhook verifications

### For Users
- [ ] Keep API keys secure and rotate periodically
- [ ] Use strong, unique passwords for related services
- [ ] Monitor your Coinbase Commerce dashboard for unauthorized charges
- [ ] Report any suspicious activity immediately

## Recent Security Updates

### v1.1.0 (July 2026)
- Added rate limiting to all API endpoints
- Implemented input validation and sanitization
- Hardened CORS configuration (no more wildcard origins)
- Added security headers to all responses
- Improved webhook signature verification with constant-time comparison
- Added HTTPS enforcement
- Added request body size limits

## Compliance

### GDPR
- Minimal data collection (email only for key delivery)
- No tracking cookies
- No analytics without consent
- Right to deletion upon request

### PCI DSS
- No credit card data processed or stored
- All payments handled by Coinbase Commerce (PCI compliant)
- No cardholder data environment

## Contact

For security-related questions or concerns:
- **Email:** constanza@aigen7ev.ai
- **GitHub:** [@constanza8999](https://github.com/constanza8999)

---

**Last Updated:** July 12, 2026
**Version:** 1.1.0
