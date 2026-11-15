# CartNest technical interview cheat sheet

## Architecture and folders

- React/Vite SPA in `frontend/`; Express/Prisma API in `backend/`; PostgreSQL persistence.
- Routes map HTTP requests, controllers adapt HTTP, services contain business rules, Zod validators parse inputs, middleware handles JWT/RBAC/errors.
- Customer and admin layouts/routes are separate; backend authorization remains authoritative.

## Prisma relationships

- A user has addresses, one cart, orders, audit records, idempotency records, and actor history.
- Categories own products; products have variants, cart items, order items, and stock movements.
- Orders contain immutable item snapshots, payment records, status history, and inventory movements.
- FK delete rules preserve order/product history where deleting rows would be unsafe.

## JWT and RBAC

- bcryptjs hashes passwords; JWT is signed with a required environment secret and expiry.
- Middleware verifies JWT, reloads a minimal user projection, and enforces roles.
- Admin routes all apply `authenticate` and `authorize('ADMIN')` on the API. A hidden frontend link is not the security boundary.

## Transactions and atomic stock

- Checkout transaction reads current catalogue prices, persists order snapshots and payment/status records, adjusts stock, logs movements, saves idempotency response, and clears the cart atomically.
- Stock decrement uses a conditional `UPDATE ... WHERE stock >= quantity`; if no row updates, checkout aborts instead of overselling.
- Inventory adjustments, cancellation/restocking, and valid order transitions are server-side transactional operations.

## Idempotency

- Client sends a unique `Idempotency-Key` per logical checkout attempt.
- Backend stores the key, request hash, response, and order association in the same transaction as the order.
- A matching retry replays the prior response. Reuse by another user or with a different payload is rejected.

## Payment and order lifecycle

- Payment outcomes are simulated; no actual gateway call or money movement occurs.
- Order states: `PLACED`, `PAID`, `PACKED`, `SHIPPED`, `DELIVERED`, `CANCELLED`; service validates allowed transitions and writes history.
- Eligible dashboard revenue sums totals for non-cancelled orders with a successful payment. A real gateway integration would need webhook verification and refund reconciliation.

## Testing strategy

- Jest + Supertest integration tests exercise auth, catalog, cart, addresses, checkout/idempotency/stock, and admin operations against PostgreSQL.
- Prisma validation and migration status check the schema/database contract; Vite production build checks SPA compilation.
- Current verified results are recorded in [QA results](QA_RESULTS.md).

## Tradeoffs to acknowledge

- JWT is kept in `localStorage` (XSS exposure tradeoff).
- Payment is simulation-only.
- Seed is restricted to a new empty database and is not crash-atomic.
- Production hardening still needs deployment-specific CSP, rate limits, monitoring, backups, and provider integration.
