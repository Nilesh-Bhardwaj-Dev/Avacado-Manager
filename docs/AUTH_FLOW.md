# Authentication Flow

## Overview

The platform uses **JWT access tokens** (15 minutes) and **opaque refresh tokens** (30 days) with **refresh token rotation**. Tokens are stored in **HttpOnly Secure cookies**; refresh token hashes are persisted in MongoDB.

```mermaid
sequenceDiagram
  participant Client
  participant API
  participant MongoDB

  Client->>API: POST /api/auth/login (credentials)
  API->>MongoDB: Verify Argon2 password
  API->>MongoDB: Store refresh token hash + session
  API-->>Client: Set-Cookie access_token, refresh_token, csrf_token
  API-->>Client: { user }

  Client->>API: GET /api/tasks (cookies auto-sent)
  API->>API: Verify JWT from cookie
  API-->>Client: 200 data

  Note over Client,API: Access token expires (15m)
  Client->>API: POST /api/auth/refresh
  API->>MongoDB: Rotate refresh token
  API-->>Client: New cookies

  Client->>API: POST /api/auth/logout
  API->>MongoDB: Revoke session
  API-->>Client: Clear cookies
```

## Two-factor authentication (TOTP)

```mermaid
sequenceDiagram
  participant User
  participant API

  User->>API: POST /login (password only)
  API-->>User: { requires2FA, tempToken }
  User->>API: POST /2fa/verify-login { tempToken, totpCode }
  API-->>User: { user } + auth cookies
```

## Password reset

1. `POST /api/auth/forgot-password` — sends one-time link (1 hour).
2. User opens link with `?resetToken=...`
3. `POST /api/auth/reset-password` — validates token, Argon2 hash, revokes all sessions.

OTP reset remains available via `email` + `otp` on the same reset endpoint.

## CSRF

State-changing requests require header `X-CSRF-Token` matching the `csrf_token` cookie (double-submit pattern).

## Roles

| accountRole | Description |
|-------------|-------------|
| superadmin | Platform operator |
| admin | Tenant workspace owner |
| teamlead | Team leadership |
| projectmanager | PM access |
| user | Team member |
| viewer | Read-only |

Use `requireRole()` and `requireMinimumRole()` middleware for route protection.
