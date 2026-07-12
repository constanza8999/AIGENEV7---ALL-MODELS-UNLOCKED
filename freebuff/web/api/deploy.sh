#!/bin/bash
# ──────────────────────────────────────────────
# AIGENEV7 Payment Worker — Deployment Script
# ──────────────────────────────────────────────
# Usage:
#   ./deploy.sh              # Deploy to production
#   ./deploy.sh staging      # Deploy to staging
#   ./deploy.sh secrets      # Set secrets interactively
#   ./deploy.sh dev          # Run local dev server
#   ./deploy.sh logs         # Tail production logs

set -euo pipefail
cd "$(dirname "$0")"

ENV="${1:-production}"
WRANGLER="npx wrangler"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}  AIGENEV7 Payment Worker — Cloudflare${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"

# ── Check prerequisites ──
check_prereqs() {
  if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is required. Install from https://nodejs.org${NC}"
    exit 1
  fi
  if ! command -v npx &> /dev/null; then
    echo -e "${RED}✗ npx is required. Install npm: npm install -g npm${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ Node.js $(node -v)${NC}"
  if ! npx wrangler --version &> /dev/null 2>&1; then
    echo -e "${YELLOW}Installing wrangler...${NC}"
    npm install
  fi
  echo -e "${GREEN}✓ Wrangler ready${NC}"
}

# ── Set secrets interactively ──
set_secrets() {
  echo -e "\n${YELLOW}Setting Cloudflare Worker secrets...${NC}"
  echo "You'll be prompted to paste each secret value.\n"

  echo -e "${YELLOW}1/3 Coinbase Commerce API Key${NC}"
  echo "  Get from: https://dashboard.commerce.coinbase.com/settings/api"
  $WRANGLER secret put COINBASE_COMMERCE_API_KEY

  echo -e "\n${YELLOW}2/3 GitHub Personal Access Token${NC}"
  echo "  Create at: https://github.com/settings/tokens"
  echo "  Required scopes: repo (full control)"
  $WRANGLER secret put GITHUB_TOKEN

  echo -e "\n${YELLOW}3/3 Coinbase Commerce Webhook Secret${NC}"
  echo "  Get from: https://dashboard.commerce.coinbase.com/settings/webhooks"
  $WRANGLER secret put WEBHOOK_SECRET

  echo -e "\n${GREEN}✓ All secrets configured!${NC}"
}

# ── Deploy ──
deploy() {
  local env_flag=""
  if [ "$ENV" != "production" ]; then
    env_flag="--env $ENV"
  fi

  echo -e "\n${YELLOW}Deploying to Cloudflare ($ENV)...${NC}"
  $WRANGLER deploy $env_flag

  echo -e "\n${GREEN}✓ Deployed successfully!${NC}"
  echo -e "\n${YELLOW}Worker URL:${NC}"

  if [ "$ENV" = "production" ]; then
    echo "  https://aigenev7-payment-worker.<your-subdomain>.workers.dev"
  else
    echo "  https://aigenev7-payment-worker-$ENV.<your-subdomain>.workers.dev"
  fi

  echo -e "\n${YELLOW}Test endpoints:${NC}"
  echo "  GET  /health"
  echo "  POST /api/create-charge"
  echo "  POST /api/webhook"
}

# ── Local dev ──
run_dev() {
  echo -e "\n${YELLOW}Starting local dev server...${NC}"
  echo "Make sure .dev.vars is configured with your secrets.\n"
  $WRANGLER dev
}

# ── Tail logs ──
tail_logs() {
  local env_flag=""
  if [ "$ENV" != "production" ]; then
    env_flag="--env $ENV"
  fi
  echo -e "\n${YELLOW}Tailing $ENV logs...${NC}"
  $WRANGLER tail $env_flag
}

# ── Main ──
check_prereqs

case "$ENV" in
  secrets)
    set_secrets
    ;;
  dev)
    run_dev
    ;;
  logs)
    tail_logs
    ;;
  production|staging)
    deploy
    ;;
  *)
    echo -e "${RED}Unknown command: $ENV${NC}"
    echo "Usage: ./deploy.sh [production|staging|secrets|dev|logs]"
    exit 1
    ;;
esac
