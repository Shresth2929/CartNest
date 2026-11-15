# CartNest demo script (3–5 minutes)

Use the local seeded database and locally configured dummy accounts. Do not demo with real customer data or payment credentials.

1. **Storefront (30–40 sec):** show the home page, category navigation, featured items, and responsive catalogue.
2. **Customer access (30 sec):** register a disposable customer or sign in as `customer@cartnest.test`; show authentication-aware navigation.
3. **Product discovery (40 sec):** search for an item, filter by category/price, open a product, select an available variant, and add it to the cart.
4. **Cart and checkout (50 sec):** update/remove a quantity, choose or add a delivery address, and point out that displayed totals are computed authoritatively by the server.
5. **Payment outcome (30 sec):** use the simulation control to demonstrate a declined attempt (no order/stock deduction), then complete a successful simulated checkout.
6. **Order history (20 sec):** open the confirmation and order history/detail to show status and tracking history.
7. **Admin workspace (50 sec):** sign in with `admin@cartnest.test`; show dashboard KPIs/revenue definition, product/category management, stock movements, order management, reports, and audit logs.
8. **Close (10 sec):** explain API validation, role enforcement, database transactions, and idempotency.

If local seed data is unavailable, create fresh dummy data in a disposable local database. The seed command intentionally refuses to run on a non-empty database.
