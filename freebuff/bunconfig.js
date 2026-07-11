/**
 * AIGENEV7 Bun Runtime Configuration
 *
 * Configures the Bun runtime for:
 *   - Uncensored mode (no content filtering)
 *   - Unlimited token pools
 *   - Provider API configuration
 *   - Network behavior
 */

module.exports = {
  // ── Uncensored Mode ───────────────────────────────────────────────────
  uncensored: true,
  contentFilter: false,
  safetyCheckers: false,

  // ── Token Pool (Unlimited) ────────────────────────────────────────────
  tokenPool: {
    maxTokens: Infinity,
    replenishRate: Infinity,
    initialTokens: Infinity,
    bucketSize: Infinity,
  },

  // ── Network ───────────────────────────────────────────────────────────
  network: {
    // No request timeout (unlimited inference)
    requestTimeout: 0,
    // Max retries on connection failure
    maxRetries: 3,
    // Retry delay in ms
    retryDelay: 1000,
    // Allow all DNS resolution
    dns: 'system',
  },

  // ── Provider API Endpoints ────────────────────────────────────────────
  providers: {
    anthropic: {
      baseUrl: 'https://api.anthropic.com/v1',
      maxRetries: 3,
    },
    deepseek: {
      baseUrl: 'https://api.deepseek.com/v1',
      maxRetries: 3,
    },
    openai: {
      baseUrl: 'https://api.openai.com/v1',
      maxRetries: 3,
    },
    google: {
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      maxRetries: 3,
    },
    openrouter: {
      baseUrl: 'https://openrouter.ai/api/v1',
      maxRetries: 3,
    },
  },

  // ── Runtime ───────────────────────────────────────────────────────────
  runtime: {
    // Allow loading .env files
    env: true,
    // Enable fetch with no limit
    fetch: true,
    // Allow all Node.js APIs
    nodeModules: true,
  },
}
