# Security Architecture

## Folder structure

```
backend/
├── config/
│   ├── auth.config.js      # JWT, cookies, rate limits
│   └── socket.js           # Socket.io JWT auth
├── constants/
│   ├── roles.js            # RBAC roles & hierarchy
│   └── collections.js      # MongoDB collection names
├── controllers/
│   ├── auth.controller.js
│   ├── twoFactor.controller.js
│   └── securityAudit.controller.js
├── middleware/
│   ├── auth.middleware.js  # JWT verification
│   ├── role.middleware.js
│   ├── rateLimit.middleware.js
│   ├── sanitize.middleware.js
│   ├── csrf.middleware.js
│   └── validate.middleware.js
├── models/
│   └── indexes.js          # TTL & unique indexes
├── services/
│   ├── auth.service.js
│   ├── password.service.js # Argon2id
│   ├── token.service.js
│   ├── session.service.js
│   ├── audit.service.js
│   ├── loginSecurity.service.js
│   └── twoFactor.service.js
├── validators/
│   └── auth.validators.js
└── utils/
    ├── logger.js
    └── device.util.js
```

## Password security

- **Argon2id** (memory 64MB, time 3, parallelism 4).
- Plain passwords sent only over HTTPS (no client-side SHA-256).
- Strength rules: 8+ chars, upper, lower, number, special.
- **Password history** prevents reuse of last 5 hashes.
- Legacy SHA-256 hashes are verified once, then upgraded on successful login.

## Token security

| Token | Storage | Lifetime |
|-------|---------|----------|
| Access JWT | HttpOnly cookie `access_token` | 15 minutes |
| Refresh opaque | HttpOnly cookie + MongoDB hash | 30 days |
| CSRF | Readable cookie + `X-CSRF-Token` header | Session |

Refresh tokens use **rotation**: each refresh revokes the previous token and issues a new family-linked token.

## Account protection

- Failed login tracking (`login_attempts` collection).
- Lockout after 5 failures in 15 minutes.
- Login history with IP, user agent, device label.
- `lastLoginAt` on user document.

## Audit logging

`security_audit_logs` records: login, logout, password change/reset, user create/delete, 2FA changes, token refresh, account lock.

Super Admin API: `GET /api/superadmin/security-audit`

## API hardening

- **Helmet** security headers
- **express-rate-limit** (global + auth routes)
- **express-mongo-sanitize** (NoSQL injection)
- **express-validator** input validation
- **CORS** with credentials whitelist

## Production checklist

1. Set strong `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (64+ random bytes each).
2. Set `NODE_ENV=production` (enables Secure cookies, Strict SameSite).
3. Configure `CORS_ORIGIN` and `COOKIE_DOMAIN` for your SPA domain.
4. Use TLS termination (HTTPS only).
5. Run MongoDB with authentication and network isolation.
6. Rotate secrets periodically; logout-all forces re-auth.
7. Monitor `security_audit_logs` and failed `login_attempts`.
8. Enable Resend/email for password reset delivery.
9. Consider Redis for rate-limit store at scale (replace in-memory limiter).
10. Back up MongoDB including `refresh_tokens` and audit collections.

## Default seeded credentials (development only)

After a fresh seed:

- Super Admin: `admin` / `Admin123!`
- Admin PM: `siddharth` / `Password123!`

Change these immediately in production.
