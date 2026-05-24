# RBAC — Role-Based Access Control

## Overview

Multi-tenant RBAC with **organization** and **project** scopes. Permissions are resolved per request from memberships and role inheritance (not embedded in JWT).

## Context headers

| Header | When |
|--------|------|
| `X-Organization-Id` | All `/api/organizations/:orgId/*` tenant APIs |
| `X-Project-Id` | Project-scoped actions (tasks, project members) |

## System roles

| Key | Scope | Description |
|-----|-------|-------------|
| `super_admin` | platform | Full access |
| `org_admin` | organization | Manage org, billing, invites, roles |
| `project_manager` | project | Full project + reports |
| `team_lead` | project | Inherits developer + assign/delete tasks |
| `developer` | project | Inherits viewer + create/edit tasks |
| `qa_engineer` | project | Inherits viewer + create/edit tasks |
| `viewer` | project | View reports only |

## Permissions

`create_project`, `edit_project`, `delete_project`, `create_task`, `edit_task`, `delete_task`, `assign_task`, `invite_user`, `manage_roles`, `export_reports`, `view_reports`, `manage_organization`, `manage_billing`, `view_audit_logs`

## API examples

```http
GET /api/organizations
Authorization: Cookie access_token

GET /api/organizations/{orgId}/me/permissions
X-Organization-Id: {orgId}

POST /api/organizations/{orgId}/projects
X-Organization-Id: {orgId}
Body: { "name": "Engineering", "key": "ENG" }

GET /api/organizations/{orgId}/projects/{projectId}/tasks
X-Organization-Id: {orgId}
X-Project-Id: {projectId}
```

## Custom roles

`POST /api/organizations/{orgId}/roles` with `{ name, key, permissionKeys, inheritsFromRoleId }`. System roles cannot be modified.

## Migration

On first startup (zero organizations), legacy `admin` users are migrated to organizations automatically. Force re-run with `RUN_RBAC_MIGRATION=true`.

## Frontend

- `usePermission('create_task')` — hook
- `<Can permission="edit_task">...</Can>` — conditional UI
- `<ProtectedRoute permission="manage_roles">` — route guard
- Org/project switcher sets context headers via `localStorage`

## Environment

See `.env.example`: `RBAC_LEGACY_MODE`, `REQUIRE_EMAIL_VERIFICATION`, `RUN_RBAC_MIGRATION`.
