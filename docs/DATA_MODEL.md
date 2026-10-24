# Venture (ComplyEasy AI) — Data Model

Two login roles share one platform: **Accountant** (manages many Clients)
and **Client** (an MSME owner who sees only their own compliance data).

## Entities

### User
The single auth table for both roles.

| Field | Type | Notes |
|---|---|---|
| id | integer PK | |
| email | text, unique | login identifier |
| password_hash | text | scrypt hash, see Auth notes |
| role | text | `accountant` \| `client` |
| created_at | datetime | |

There is **one** User table, not two parallel auth systems. `role` is what
branches behavior everywhere else.

### AccountantProfile
Extra info tied to a User with `role = accountant`. 1:1 with User.

| Field | Type | Notes |
|---|---|---|
| id | integer PK | |
| user_id | integer FK → User, unique | |
| firm_name | text | |
| phone | text, nullable | |

### Client
An MSME business record. Belongs to exactly one Accountant.

| Field | Type | Notes |
|---|---|---|
| id | integer PK | |
| accountant_id | integer FK → User (role=accountant) | owner, required |
| business_name | text | |
| registration_id | text | GSTIN / MSME reg. number or similar |
| contact_person | text | |
| contact_email | text | |
| contact_phone | text, nullable | |
| linked_user_id | integer FK → User (role=client), nullable, unique | see "Unclaimed clients" |
| invite_token_hash | text, nullable | set when an invite is pending |
| invite_expires_at | datetime, nullable | |
| created_at | datetime | |

### ComplianceItem
Belongs to one Client.

| Field | Type | Notes |
|---|---|---|
| id | integer PK | |
| client_id | integer FK → Client | required |
| name | text | e.g. "GST Registration", "Trade License" |
| issue_date | date, nullable | |
| expiry_date | date | required — status is computed from this |
| notes | text, nullable | |
| created_at | datetime | |

## Relationships & cardinality

- One **Accountant** (User where role=accountant) → many **Client** records.
- One **Client** → zero-or-one linked **Client-role User**
  (`Client.linked_user_id`). A Client can exist with no linked login.
- One **Client** → many **ComplianceItem** records.
- One Client-role **User** ↔ exactly one Client (`linked_user_id` is unique).

```
Accountant(User) ──1───∞── Client ──1───∞── ComplianceItem
                              │0..1
                              └──── Client(User)
```

## Unclaimed clients (the invite flow's data-model shape)

A Client record's lifecycle has three states, tracked without a separate
status column — derived from the fields above:

1. **Unclaimed / not invited** — `linked_user_id` is NULL and
   `invite_token_hash` is NULL. The accountant added the client but hasn't
   sent an invite yet. The client has no way to log in.
2. **Invited, pending activation** — `linked_user_id` is still NULL, but
   `invite_token_hash` and `invite_expires_at` are set. A link has been
   generated and is waiting to be used. If `invite_expires_at` passes with
   no activation, the accountant can re-trigger the invite (overwriting the
   token/expiry — old links stop working).
3. **Active** — `linked_user_id` points at a real User with role=client.
   `invite_token_hash` is cleared once the client sets their password.

This is intentionally modeled as **Client first, login later** — a
`Client` row is always created directly by the Accountant filling in a
form; nothing about a Client depends on a User existing yet. This is the
opposite of typical invite systems where you invite an email and the
"business record" is created on acceptance.

## Permission rules (plain language)

- **Accountant**: full read/write on every `Client` and `ComplianceItem`
  where `Client.accountant_id = <their own User.id>`. Never anyone else's.
- **Client-role User**: read-only (MVP default — see Prompt 6) on the
  `ComplianceItem`s belonging to the **one** `Client` row where
  `Client.linked_user_id = <their own User.id>`. Nothing else — not other
  clients of the same accountant, not the accountant's portfolio-level
  views, not other accountants' clients.
- A Client-role user with no linked Client row (shouldn't normally happen,
  since login only exists after activation) sees an empty/error state, not
  another client's data by fallback.
- Enforcement is **at the API layer**, on every query — every
  Client/ComplianceItem read or write is scoped by a `WHERE` clause tied to
  the authenticated user's id and role, not filtered client-side after a
  broader fetch.

## ComplianceItem status logic

Computed from `expiry_date` relative to today, not stored:

| Status | Condition |
|---|---|
| `expired` | `expiry_date < today` |
| `expiring_soon` | `today <= expiry_date <= today + 30 days` |
| `active` | `expiry_date > today + 30 days` |

30 days is the single threshold for "expiring soon" across the app
(dashboard counts, client detail highlighting, portal view).

## Auth notes (informs Prompt 2)

- Passwords hashed with `scrypt` (Node's built-in `crypto`), per-user
  random salt — no external hashing library needed.
- Sessions are a signed, stateless token (HMAC-SHA256 over
  `{user_id, role, issued_at}`), set as an httpOnly cookie — same shape as
  a JWT, implemented without an external JWT library since none were
  available to install in this environment.
- Invite tokens: a random 32-byte token is generated, only its hash is
  stored (`Client.invite_token_hash`), the raw token goes out in the
  invite link. This mirrors how the password reset / invite pattern is
  usually done — the DB never holds a usable secret.

## Out of scope for MVP

- Multiple Accountant users per firm / team accounts (one Accountant login
  owns its Clients directly, no org layer).
- A Client being managed by more than one Accountant.
- File/document uploads on ComplianceItems.
- Email/SMS delivery of reminders (in-app status only; see Prompt 8 notes).
- The AI compliance assistant from the original pitch.
- Pricing/billing.
