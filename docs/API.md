# CartNest API

The API is rooted at `/api`. Start the backend before using Swagger UI at `/api/docs`; the OpenAPI JSON is `/api/docs/swagger.json`. Error responses use the backend's common JSON error structure. Request bodies, route params, and query params are validated with Zod where applicable.

Protected requests use `Authorization: Bearer <JWT>`. Admin endpoints additionally require role `ADMIN` on the server. Checkout requires `Idempotency-Key`; the client should reuse the same key when retrying the same attempt.

## Health and customer API

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/health` | Public | Database connectivity and non-sensitive counts |
| POST | `/auth/register` | Public | Register a customer |
| POST | `/auth/login` | Public | Authenticate and obtain a JWT |
| GET | `/auth/me` | Authenticated | Current user profile |
| GET | `/categories` | Public | Active categories |
| GET | `/products` | Public | Search, filter, sort, and paginate products |
| GET | `/products/:slug` | Public | Product detail and variants |
| GET | `/addresses` | Authenticated | Current user's addresses |
| POST | `/addresses` | Authenticated | Create an address |
| PUT | `/addresses/:id` | Owner | Update owned address |
| DELETE | `/addresses/:id` | Owner | Delete owned address |
| GET | `/cart` | Customer | Current user's database cart |
| POST | `/cart/items` | Customer | Add a product/variant |
| PUT | `/cart/items/:itemId` | Owner | Change cart quantity |
| DELETE | `/cart/items/:itemId` | Owner | Remove cart item |
| DELETE | `/cart` | Customer | Clear current cart |
| POST | `/checkout` | Customer | Checkout with an `Idempotency-Key` header |
| GET | `/orders` | Authenticated | Current user's orders |
| GET | `/orders/:id` | Owner or admin | Order detail |
| POST | `/orders/:id/cancel` | Owner or admin | Cancel when lifecycle rules permit |
| PATCH | `/orders/:id/status` | Admin | Admin status transition |

`GET /products` accepts `search`, `category`, `minPrice`, `maxPrice`, `sortBy`, `page`, and `limit`. Consult Swagger for exact enum values and response schemas.

## Admin API

Every `/admin` route requires a valid JWT and `ADMIN` role.

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/dashboard` | Database-backed KPIs, recent orders, trends, status counts |
| GET | `/admin/reports` | Sales, best sellers, low-stock report |
| GET | `/admin/orders` | Search/filter/paginate orders |
| GET | `/admin/orders/:id` | Admin order detail |
| PATCH | `/admin/orders/:id/status` | Validated lifecycle transition |
| GET/POST | `/admin/products` | List or create products |
| PUT/DELETE | `/admin/products/:id` | Update or safely deactivate product |
| GET/POST | `/admin/categories` | List or create categories |
| PUT/DELETE | `/admin/categories/:id` | Update or relationship-checked removal |
| GET | `/admin/inventory` | Stock overview and low-stock filtering |
| GET | `/admin/inventory/movements` | Paginated stock movement history |
| POST | `/admin/inventory/adjustments` | Validated server-side adjustment |
| GET | `/admin/customers` | Search/paginate customers |
| GET | `/admin/customers/:id` | Limited profile and order summary |
| GET | `/admin/audit-logs` | Paginated audit trail |

## Checkout semantics

The server loads the customer's cart, checks ownership of the shipping address, calculates prices/tax/shipping from database state, and uses conditional stock updates in a Prisma transaction. A successful response represents a simulated payment, not a real payment-provider charge. A simulated failure returns an error and does not create an order or deduct stock. The `Idempotency-Key` identifies a request and its response is stored transactionally to replay safe retries.

See Swagger for current response fields. Never treat client-rendered totals as authoritative.
