# UON Event Management Platform

React + Vite frontend, Express backend and SQLite database for the COMP3851A / COMP3851B project.

## Run locally

Use Node.js 22.12+ (verified with Node.js 24). Install dependencies in both folders:

```sh
npm install
cd client
npm install
```

Start the backend from the repository root:

```sh
npm start
```

In a second terminal, start the frontend:

```sh
cd client
npm run dev
```

Open http://localhost:5173 (or http://127.0.0.1:5173). The backend defaults to port 3000.
Vite proxies /api requests to the backend so the browser uses same-origin cookies.
If port 5173 is occupied, stop the conflicting development server or explicitly configure CLIENT_ORIGIN for the port you choose.

## Current functionality

- Signup and bcrypt password verification.
- Persistent, SQLite-backed sessions: a random opaque token is delivered in an HttpOnly, SameSite=Lax cookie.
  Only the token hash is stored in the database. Sessions expire after seven days; login rotates the current session and logout invalidates it.
- /me supplies the identity displayed by the UI. The old localStorage uonUser identity is discarded.
- Server-side role enforcement on every protected API.
- Public event browsing and details, with registration counts and the signed-in attendee's booking state.
- Navbar search matches event title, category or location (case-insensitive substring); queries persist in the URL, with result counts, empty results and Clear Search.
- Attendee: join events, cancel only their own registration and view My Bookings.
- Organizer: create events and edit/administer **only their own** events. Other organizers can browse them but cannot modify them or view/manage their participants.
- Organizer: view attendee names/emails, find existing attendee accounts by name/email, register or remove attendees.
- Duplicate registrations and over-capacity bookings are prevented at the database write, including concurrent requests.
- Optional event images: JPEG, PNG or WebP, maximum 2 MiB and 16 million pixels. The backend validates and decodes the actual file, strips metadata and re-encodes it as WebP. Owners can replace/remove the image when editing.
- Create/edit require a real future date and time in Australia/Sydney (Newcastle), including daylight-saving validation. Both self-registration and organizer registration close when an event starts.
- Shared frontend/backend validation: title 30 Unicode characters, description 500, location 120 with a venue/room name; capacity is an integer from 1 to 10000 and cannot be reduced below current bookings. Counts trim outer whitespace and include internal spaces and punctuation. HTML tags, script URLs and control characters are rejected; normal JavaScript course names remain valid. Legacy text is preserved until edited.
- Profile: edit own first/last names and bio; email and role are read-only.
- Admin: global event moderation, ordinary-account suspension/restoration, and an atomic audit log. Suspended accounts lose all sessions and cannot log in or receive new registrations. Organizer ownership restrictions remain unchanged.
- Cancellation requires a reason, retains the event and registrations, and prevents new bookings and editing.
  Attendees see the cancellation reason in My Bookings and receive a personal notification. Existing bookings can still be removed.
- A SQLite trigger creates one notification per current registration atomically with cancellation; a failed notification write rolls the cancellation back. Repeated cancellations do not duplicate notices.
- Notification centre: unread bell badge, All/Unread filters, mark one/all read, event links, and 15-second polling while visible plus focus/open/manual refresh. Read state persists and APIs enforce account ownership.
- Notifications preserve the event title and reason even if a registration and then its event are removed. Updates do not retroactively notify previously cancelled events.
- Permanent deletion is permitted only when an event has no registrations.

## Role policy and remaining work

createdBy is enforced as ownership on every event management endpoint. It is assigned from the signed-in session and cannot be changed by request data. Legacy events without an owner remain viewable; only Admin can moderate them, without claiming or changing ownership.
An organizer account is not an attendee account and cannot register itself as an attendee.

**Coursework demo policy:** signup still allows the user to select Organizer. Server-side role checking does not make this an approved administrator provisioning process.
Before a public launch, replace that selection with invitations or explicit administrator approval.

The lecturer feedback areas (registration, participant administration, event search, cancellation reasons and in-app notifications) are implemented.
Profile and homepage category filtering are implemented. The subscription placeholder remains outside this change. Notifications are in-app, not email or browser push.

## Database and configuration

By default the server opens users.db beside database.js. Startup performs an additive migration, keeping existing users and events and adding:
- events.status (active by default), events.cancellationReason and events.image (optional image blob);
- sessions, registrations and notifications, their indexes and integrity triggers;
- users.bio, users.status, users.banReason and admin_audit.

Existing events with zero capacity are preserved, but cannot accept registrations until an organizer sets a positive capacity.
Existing bcrypt accounts continue to work; users must sign in again after migrating from the old localStorage-only login.

Environment variables (set in the terminal/environment; no .env loader is installed):
- DB_PATH: alternative SQLite file, useful for isolated testing.
- PORT: backend port, default 3000. Update the Vite proxy target if changing it.
- CLIENT_ORIGIN: comma-separated permitted browser origins, default localhost/127.0.0.1 on 5173 and 4173.
- NODE_ENV=production: adds Secure to session cookies. Production requires HTTPS, an /api reverse proxy (stripping /api), and an explicit CLIENT_ORIGIN matching the deployed site.

All mutation requests require X-UON-Request: 1. The server checks browser Origin against the configured allowlist.
The frontend API helper sends this header and includes cookies automatically. Never send userId/role as an attendee identity credential.

## API

Backend paths below are accessed by the frontend through the /api prefix.

| Method | Path | Access |
| --- | --- | --- |
| POST | /register, /login | Public; demo role selection on signup |
| GET | /me | Signed in |
| PUT | /me/profile | Signed in; own firstName, lastName, bio only |
| GET | /admin/users?q=... | Admin |
| PUT | /admin/users/:id/status | Admin; status active/banned and reason |
| GET | /admin/audit?before=... | Admin; cursor pagination, 50 records |
| POST | /logout | Idempotent session invalidation |
| GET | /events?q=..., /events/:id | Public; optional title/category/location search |
| POST | /events | Organizer (event owner for existing events) |
| PUT / DELETE | /events/:id | Owner or Admin; Admin must supply moderationReason |
| POST | /events/:id/cancel | Owner or Admin; JSON reason |
| POST / DELETE | /events/:id/register | Attendee; identity from session |
| GET | /me/registrations | Attendee; own bookings |
| GET | /events/:id/attendees | Organizer (event owner for existing events) |
| GET | /attendees?q=... | Organizer; minimum two characters, up to 30 results |
| POST | /events/:id/attendees | Event owner; JSON userId |
| DELETE | /events/:id/attendees/:userId | Organizer (event owner for existing events) |
| GET | /notifications | Signed in; own list and unread count |
| POST | /notifications/:notificationId/read | Signed in; own notification only |
| POST | /notifications/read-all | Signed in; own notifications only |

## Demo

See [新增功能 Demo 指南](docs/DEMO_GUIDE.zh-CN.md) for preparation, a 6–8 minute walkthrough and expected results.

## Verification

```sh
npm test
cd client
npm run lint
npm run build
```

The integration tests create isolated databases and exercise real HTTP requests: session expiry/logout/rotation, forged identity,
role restrictions, cross-organizer ownership enforcement, registration isolation, duplicates, concurrent last-seat booking, capacity changes,
cancellation, origin checks and migration from the previous schema. Search and notification tests cover literal query matching, recipients, ownership, read state, duplicate prevention and atomic rollback. Image round-trips, corrupt/oversized uploads, unchanged-image edits, invalid/past dates and started-event registration are also covered (38 tests in total, including featured-event tests and the latest validation, profile and Admin coverage). They do not modify the project users.db.

Browser verification uses a separate temporary database and covers login/refresh/logout, attendee booking/cancellation,
organizer editing and attendee management, cancellation visibility and protected routes. Additional browser checks cover search, empty results, unread badges, single/all-read actions, reload persistence and account isolation.

## Administrator setup

Register a dedicated account normally, then run from the repository root:

```sh
npm run admin:grant -- registered-email@example.com --confirm
```

Use the same DB_PATH as the backend. This changes the existing role and revokes sessions; sign in again. No default administrator credentials are supplied. Public registration and Profile cannot grant Admin. Admin cannot suspend other administrators. Moderation requires a reason; booked events must be cancelled with notifications, not permanently deleted. See [管理员与本轮 Demo 指南](docs/ADMIN_GUIDE.zh-CN.md).

Mobile browser checks cover 360/390/430-pixel layouts; physical phone keyboard/touch validation remains a manual follow-up.

## Admin delegation and targeted updates

The local admin command now bootstraps only the first administrator. Existing admins grant/revoke admin access in Administration → Users via PUT /admin/users/:id/role (role and reason). Revocation selects attendee or organizer; at least one active admin must remain. Role changes invalidate all target sessions, create a personal notification and retain an audit record in one transaction.

Event text-field edits notify current registrants with old/new values (admin edits also notify the creator). Organizer manual registration/removal notifies the affected attendee; optional reason fields provide context. Unchanged edits and image-only edits do not notify registrants. These writes and notifications are atomic. Existing cancellation/restoration notifications remain supported.

## Content moderation

Admin manages initially empty blocking rules in Administration → Keywords. Backend create/edit checks titles, descriptions and locations with normalized literal substring matching (NFKC, case, whitespace and zero-width separators). Rules can be disabled; existing events are not retroactively removed. This is text filtering, not semantic or image moderation.

Authenticated users report events from their details page. One pending report per user/event and five reports per hour limit duplicates and abuse. Admin reviews Reports, opens the event for any separate moderation action, and resolves/dismisses with a response notifying the reporter. Reporter identity is private from organizers. Report snapshots survive event deletion. Rule changes and report decisions are audited.
