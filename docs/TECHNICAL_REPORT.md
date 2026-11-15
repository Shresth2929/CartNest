# CartNest technical report

## Design summary

CartNest separates the React/Vite SPA from an Express REST API. The browser uses a single fetch client for API calls, attaching JWT bearer tokens and checkout idempotency headers. Express routes validate inputs, authenticate users, enforce role checks, and delegate business rules to service modules. Prisma models the relational domain in PostgreSQL.

## Authentication and authorization

Passwords are hashed with bcryptjs. JWTs are signed and verified using a required environment secret; startup fails if the secret is missing, too short, or resembles an obvious placeholder. Tokens expire according to `JWT_EXPIRES_IN`. The authentication middleware reloads a minimal user projection from PostgreSQL and does not expose `passwordHash`. Admin route groups apply both authentication and `ADMIN` role authorization on the server. Customer address and order services scope reads and writes to the authenticated user.

The frontend currently stores the JWT in `localStorage`. This is a known tradeoff: an XSS vulnerability could expose the token. Use a strict content security policy, safe rendering, dependency hygiene, and consider an httpOnly-cookie/session redesign before production deployment.

## Input and transport protections

Zod schemas validate administrative writes and relevant customer inputs. Prisma parameterizes normal data operations; checkout's raw SQL uses Prisma tagged-template parameters and conditional stock updates. Express limits JSON and URL-encoded request bodies to 1 MB, disables the `X-Powered-By` header, and uses a configured CORS origin. Production requires `CLIENT_URL`. Secrets and local environment files are ignored by Git; `.env.example` contains placeholders only.

## Checkout, inventory, and idempotency

The server calculates price, tax, shipping, and total from current PostgreSQL product/variant prices. It never uses frontend totals as authoritative. In a database transaction, checkout revalidates active product/category state, conditionally decrements product and variant inventory, snapshots order items, writes order/payment/status history, inventory movements, the idempotency response, audit log, and cart clearing. A failed conditional update aborts the transaction and prevents negative stock.

The `Idempotency-Key` is unique in the database. Its request hash and stored response are committed in the same transaction as the order. A uniqueness race is resolved by replaying the committed record for the same user and matching request; another user's key or a changed payload is rejected.

## Order lifecycle

Supported forward states are `PLACED -> PAID -> PACKED -> SHIPPED -> DELIVERED`, with cancellation permitted only in specified early states. Status transitions use a state machine and transactional updates/history. Customer cancellation checks ownership and restores inventory atomically; successful simulated payments become refunded in the cancellation flow where applicable.

## Revenue definition

Dashboard revenue is the sum of `Order.total` for orders whose status is not `CANCELLED` and that have at least one payment with status `SUCCESS`. Failed, pending, refunded-only, and cancelled orders are excluded by that predicate. Revenue trends use the same eligibility condition for the recent 30 calendar dates. Low stock uses an inclusive threshold of 10 for active products and variants. These definitions are returned by the dashboard API.

## Admin audit trail

Administrative product/category changes, inventory adjustments, order transitions, and other key actions are written to `AuditLog` in the corresponding service transaction where applicable. Inventory movements also record actor, delta, resulting stock, reason, and optional order association. The admin API returns limited customer data and never includes password hashes or authentication tokens.

## Payment simulation

Checkout offers simulated success and failure for demonstration and test purposes only. No card credentials are requested or stored and no external payment gateway is connected. Production use requires a real provider, verified webhooks, reconciliation, and refund integration.

## Limitations and assumptions

- This is an educational/demo application, not a production-hardened commerce deployment.
- JWTs are stored in browser `localStorage`; see the security tradeoff above.
- Payments are simulated; no real charge or refund occurs.
- Product category imagery may use remote URLs; failed product images fall back to a local placeholder.
- The seed script refuses databases with existing rows and is not an incremental migration or an atomic recovery mechanism. Never use it to repair a partially seeded database.
- Demo users are local-only identities with passwords supplied by each developer; no public demo passwords are committed.
- Backups, operational monitoring, rate limiting, email verification, password reset, and production deployment are outside this repository's current scope.
