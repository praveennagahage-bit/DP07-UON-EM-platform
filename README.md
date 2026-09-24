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
- Capacity must be a positive integer and cannot be reduced below the current registration count.
- Cancellation requires a reason, retains the event and registrations, and prevents new bookings and editing.
  Attendees see the cancellation reason in My Bookings and receive a personal notification. Existing bookings can still be removed.
- A SQLite trigger creates one notification per current registration atomically with cancellation; a failed notification write rolls the cancellation back. Repeated cancellations do not duplicate notices.
- Notification centre: unread bell badge, All/Unread filters, mark one/all read, event links, and 15-second polling while visible plus focus/open/manual refresh. Read state persists and APIs enforce account ownership.
- Notifications preserve the event title and reason even if a registration and then its event are removed. Updates do not retroactively notify previously cancelled events.
- Permanent deletion is permitted only when an event has no registrations.

## Role policy and remaining work

createdBy is enforced as ownership on every event management endpoint. It is assigned from the signed-in session and cannot be changed by request data. Legacy events without an owner remain viewable but cannot be claimed or managed through these endpoints.
An organizer account is not an attendee account and cannot register itself as an attendee.

**Coursework demo policy:** signup still allows the user to select Organizer. Server-side role checking does not make this an approved administrator provisioning process.
Before a public launch, replace that selection with invitations or explicit administrator approval.

The lecturer feedback areas (registration, participant administration, event search, cancellation reasons and in-app notifications) are implemented.
Profile, subscription and homepage category-click placeholders remain outside this change. Notifications are in-app, not email or browser push.

## Database and configuration

By default the server opens users.db beside database.js. Startup performs an additive migration, keeping existing users and events and adding:
- events.status (active by default), events.cancellationReason and events.image (optional image blob);
- sessions, registrations and notifications, their indexes and integrity triggers.

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
| POST | /logout | Idempotent session invalidation |
| GET | /events?q=..., /events/:id | Public; optional title/category/location search |
| POST | /events | Organizer (event owner for existing events) |
| PUT / DELETE | /events/:id | Organizer (event owner for existing events) |
| POST | /events/:id/cancel | Event owner; JSON reason |
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
cancellation, origin checks and migration from the previous schema. Search and notification tests cover literal query matching, recipients, ownership, read state, duplicate prevention and atomic rollback. Image round-trips, corrupt/oversized uploads, unchanged-image edits, invalid/past dates and started-event registration are also covered (19 integration tests). They do not modify the project users.db.

Browser verification uses a separate temporary database and covers login/refresh/logout, attendee booking/cancellation,
organizer editing and attendee management, cancellation visibility and protected routes. Additional browser checks cover search, empty results, unread badges, single/all-read actions, reload persistence and account isolation.
