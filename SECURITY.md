# 🔒 Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 7.0.x   | ✅ Active support |
| < 7.0   | ❌ Not supported |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in AIGENEV7, please report it privately.

**Do NOT report security issues in the public issue tracker.**

### How to Report

1. **GitHub**: Open a private security advisory at:
   `https://github.com/constanza8999/AIGENEV7---ALL-MODELS-UNLOCKED/security/advisories/new`

2. **Direct**: Reach out to **@constanza8999** via GitHub

You should receive a response within **48 hours**. If you don't, please follow up.

### What to Include

- Type of vulnerability
- Steps to reproduce
- Affected versions
- Potential impact
- Any suggested fix (if available)

---

## 🛡️ Security Best Practices for Contributors

### API Keys & Secrets

**Never commit API keys, tokens, or passwords to the repository.** The project's `.gitignore` already excludes `.env` and `.env.*` files. Keep your keys safe:

```env
# BAD — Don't add real keys to any file committed to git
DEEPSEEK_API_KEY=sk-real-key-here  # ❌

# GOOD — Use .env (already gitignored)
DEEPSEEK_API_KEY=sk-your-key  # ✅
```

### Environment Files

- `.env` — **Never commit** (contains secrets, already gitignored)
- `.env.example` — Safe to commit (contains placeholder values only)
- `.env.local` / `.env.*.local` — Should not be committed

### Personal Access Tokens

If you expose a GitHub token:
1. **Revoke it immediately** at https://github.com/settings/tokens
2. **Create a new one** with minimal required permissions
3. **Never paste tokens** in issues, PRs, or discussions

---

## 🔐 GitHub Account Security Checklist

### For Your Account

- [ ] **Two-Factor Authentication (2FA)** — Enable at https://github.com/settings/security
- [ ] **Strong password** — Unique, not reused from other sites
- [ ] **Review authorized applications** — https://github.com/settings/applications
- [ ] **Review SSH keys** — https://github.com/settings/keys
- [ ] **Personal access tokens** — Use fine-grained tokens with minimal scopes
- [ ] **Recovery methods** — Add recovery codes and backup email

### For Your Repositories

- [ ] **Branch protection** — Protect `main` branch from force pushes
- [ ] **Required reviews** — Require PR reviews before merging
- [ ] **Dependency graph** — Enable Dependabot alerts
- [ ] **Code scanning** — Enable CodeQL analysis
- [ ] **Secret scanning** — GitHub automatically scans for exposed keys
- [ ] **Deploy keys** — Use deploy keys instead of personal tokens in CI

### Recommended GitHub Settings

| Setting | Recommendation |
|---------|---------------|
| Two-factor authentication | ✅ **Required** |
| Session expiration | Set to 30 days |
| Authorized apps | Review quarterly |
| Personal tokens | Use fine-grained, repo-specific tokens |
| SSH keys | Rotate keys every 6 months |

---

## 🔄 Dependency Security

AIGENEV7 uses automated dependency management:

- Dependencies are audited during build
- Keep `bun.lock` and `package.json` up to date
- Review dependency updates before merging

---

## 📝 License & Legal

AIGENEV7 is provided under the MIT License. The software is provided "as is", without warranty of any kind.

---

*Last updated: July 2026*
