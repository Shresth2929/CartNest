# CartNest

CartNest is a full-stack multi-category e-commerce demonstration built with React, Express, PostgreSQL, and Prisma. It includes a customer storefront and a separately protected admin workspace.

## Features

- Product catalogue backed by PostgreSQL, with category, search, price, sorting, and pagination filters.
- Customer registration, login, profile and address book, persistent server-side cart, order history, and cancellation.
- Checkout with database-calculated prices, atomic stock deduction, payment simulation, and idempotency keys.
- Role-protected admin dashboard, product/category management, inventory adjustments, order management, customer summaries, reports, and audit logs.
- API validation with Zod, JWT authentication, Prisma migrations, and Swagger UI.

## Technology

- Frontend: React 18, Vite, JavaScript, Tailwind CSS, React Router, Lucide React, Recharts.
- Backend: Node.js, Express, Prisma, PostgreSQL, Zod, Jest, Supertest.

## Requirements

- Node.js 18 or newer and npm.
- PostgreSQL reachable from the backend.
- A database and database user configured for the local environment.

## Local setup

The backend and frontend are separate npm projects; install dependencies in each directory.

1. Configure PostgreSQL and create an empty `cartnest` database.
2. In `backend`, copy `.env.example` to `.env`. Set `DATABASE_URL` and generate a unique `JWT_SECRET` with at least 32 characters. Set local-only passwords of at least 12 characters for `ADMIN_PASSWORD` and `DEMO_CUSTOMER_PASSWORD`. Do not reuse production credentials.
3. Install and initialize the backend:

   ```powershell
   cd backend
   npm ci
   npx prisma generate
   npx prisma migrate deploy
   npm run prisma:seed
   npm run dev
   ```

   The seed script is for a new, empty database only. It refuses to run when it detects existing records; it never clears data. Seed is not an incremental update or recovery tool.
4. In a second terminal, install and start the frontend:

   ```powershell
   cd frontend
   Copy-Item .env.example .env
   npm ci
   npm run dev
   ```

5. Open <http://localhost:5173>. Vite proxies `/api` to `http://localhost:5000`. If the services use different origins, set `CLIENT_URL` in the backend and `VITE_API_URL` in the frontend.

The API health endpoint is <http://localhost:5000/api/health>. Interactive API documentation is at <http://localhost:5000/api/docs>; the OpenAPI JSON is at <http://localhost:5000/api/docs/swagger.json>.

## Demo accounts

The seed creates local-only dummy accounts using the email values configured in `backend/.env.example`:

- Admin: `admin@cartnest.test`
- Customer: `customer@cartnest.test`

Set their passwords locally in `backend/.env` before seeding. Passwords are intentionally not published or committed. Do not use the example identities outside a disposable demo environment.

## Verification

```powershell
cd backend
npm test
npx prisma validate
npx prisma migrate status

cd ..\frontend
npm run build
```

See [QA results](docs/QA_RESULTS.md) for the checks completed for this revision, and [API documentation](docs/API.md) for endpoint groups and Swagger usage.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Entity relationship diagram](docs/ER_DIAGRAM.md)
- [API documentation](docs/API.md)
- [Technical report and security notes](docs/TECHNICAL_REPORT.md)
- [Production deployment integration](docs/DEPLOYMENT.md)
- [Demo script](docs/DEMO_SCRIPT.md)
- [Technical interview cheat sheet](docs/INTERVIEW_CHEAT_SHEET.md)
- [QA results and known limitations](docs/QA_RESULTS.md)

## AI tools disclosure

AI-assisted development tools were used during implementation and review. All generated or suggested changes remain subject to human review, automated testing, and the verification results recorded in the QA documentation.
