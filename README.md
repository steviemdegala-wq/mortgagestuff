# Stevie De Gala CRM

Personal mortgage broker CRM with a daily conversation tracker, referral partner manager, and client pipeline.

## Local development

### 1. Install dependencies

```bash
npm install
```

### 2. Set environment variables

Edit the `.env` file with your actual values:

```
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
APP_PASSWORD="your-chosen-password"
SESSION_SECRET="a-random-string-of-at-least-32-characters"
```

The `SESSION_SECRET` must be at least 32 characters long.

### 3. Run the database migration

This creates the database tables and generates the Prisma client:

```bash
npx prisma migrate dev --name init
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser and sign in with the password from `APP_PASSWORD`.

## Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `APP_PASSWORD` | Single shared password to access the app |
| `SESSION_SECRET` | Secret for signing session cookies (min 32 chars) |

## Deployment (Vercel)

1. Push this repo to GitHub.
2. Import the repo in Vercel.
3. Under Settings > Environment Variables, add `DATABASE_URL`, `APP_PASSWORD`, and `SESSION_SECRET`.
4. Run the migration against your production database:
   ```bash
   DATABASE_URL="your-production-url" npx prisma migrate deploy
   ```
5. Redeploy on Vercel.

## Tech stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS 4
- Prisma 7 (PostgreSQL)
- iron-session (auth)
- Recharts (charts)
