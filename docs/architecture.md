# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Keep each capability within its existing tier: React pages render API data and accessible request states; Express routes/services validate input and own business rules; Mongoose schemas and the seed script own persistence and stable demo data.

- Presentation tier decision: Keep the React/Vite routes and shared `src/api/client.ts` as the presentation boundary. Render each API response, request suggestions for `mona@example.com`, and provide accessible loading (`role="status"`), meaningful empty, and error (`role="alert"`) states.
- Logic tier decision: Implement API behavior in the existing Express `/api/*` routes and service layer. Validate request fields and references before persistence, return deliberate 4xx responses for invalid or unknown records, and avoid surfacing cast failures as 500 responses.
- Data tier decision: Enforce required identity, goal, team, activity, and workout fields in Mongoose; keep team members as an array defaulting to `[]` and activity user/team as references. Seed stable representative records idempotently without deleting unrelated records, and reconcile a seeded user's prior team membership.
- Activity tracking approach: Accept `userId`, `teamId`, `type`, and `minutes`; validate both IDs and that both records exist, then save the user/team references with computed positive `points` and `occurredAt`. List activities with those fields in the API response.
- Team management approach: Reject a missing team name with `400`; create and list teams with their submitted `name` and `mascot`, and expose member IDs in the response.
- Leaderboard approach: Sum activity points per team, sort teams by descending totals, and return `teamName`, `totalPoints`, and sequential 1-based `rank` values.
- Workout suggestions approach: Find the requested user by email and choose the first suggestion to match their fitness goal or recent activity, with a reason that explains the match. Return a 4xx response when no user matches rather than selecting a global first workout.

## Test plan

Baseline observed on 2026-11-20: the data, API, and frontend contract suites fail; both builds pass. Re-run these commands after each tier change and use the failing contract to keep fixes bounded.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — a failure means a Mongoose required-field/default/reference contract or seed behavior is incorrect. Baseline: 4 of 5 tests fail on required-field validation for User, Team, Activity, and Workout; the seed/idempotence test passes.
- API command: `npm run test:api --prefix octofit-tracker/backend` — a failure means request validation/status codes, persisted response fields, team membership, point aggregation/ranking, or user-specific suggestions violate the contract. Baseline: 4 of 4 tests fail: invalid activity and nameless team requests return `501` instead of `400`, the leaderboard is empty, and Mona receives the strength workout instead of the endurance/run match.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — a failure means a route is not rendering API data or is missing its accessible loading, empty, or error state, or the workout page is not requesting the specified user. Baseline: 15 of 15 tests fail across those behaviors.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — a failure indicates backend TypeScript does not type-check. Baseline: passes.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — a failure indicates frontend TypeScript or the Vite production build fails. Baseline: passes.
