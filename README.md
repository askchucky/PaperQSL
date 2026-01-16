# PaperQSL Manager

A multi-user web application for managing paper QSL cards for ham radio operators.

## Features

- Upload and parse ADIF files
- Track QSOs and deduplicate callsigns
- Manage paper QSL eligibility
- Store mailing addresses with source tracking
- Track full QSL lifecycle (sent, received, status)
- Export CSV files
- Generate PDF mailing labels (Avery 5160)
- Optional QRZ XML integration (username/password)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Authentication**: Clerk
- **Database**: Neon Postgres + Prisma
- **Storage**: Vercel Blob
- **PDF Generation**: pdf-lib
- **Hosting**: Vercel

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Fill in:
- `DATABASE_URL`: Your Neon Postgres connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: From Clerk dashboard
- `CLERK_SECRET_KEY`: From Clerk dashboard
- `BLOB_READ_WRITE_TOKEN`: From Vercel dashboard
- `ENCRYPTION_KEY`: 32-byte hex string for encrypting QRZ credentials
- `NEXT_PUBLIC_APP_URL`: Your app URL (http://localhost:3000 for dev)

3. Set up the database:
```bash
npx prisma db push
```

4. Run the development server:
```bash
npm run dev
```

## Development

- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio
- `npm run db:migrate` - Create migration

## Deployment

This app is designed to be deployed on Vercel. Make sure to:

1. Connect your GitHub repository to Vercel
2. Add all environment variables in Vercel dashboard
3. Set up Neon database and add `DATABASE_URL`
4. Configure Vercel Blob storage and add `BLOB_READ_WRITE_TOKEN`
5. Deploy!
