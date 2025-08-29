# Database Connection Manager

A SolidStart application that allows you to create and manage database connections with a browser-based database viewer similar to Drizzle Studio or Neon.tech.

## Features

- Create database connections with custom names and colors
- Test connections before saving
- Browser-based database viewer
- Execute custom SQL queries
- View database schema
- Double-click connections to open them in the viewer

## Tech Stack

- **Frontend**: SolidStart (SolidJS)
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon PostgreSQL (recommended)

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your database:
   - Create a PostgreSQL database (Neon recommended)
   - Copy `.env.example` to `.env`
   - Update `DATABASE_URL` with your database connection string

4. Generate and run database migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

1. Click "Add Connection" to create a new database connection
2. Enter a name, choose a color, and provide the connection string
3. Test the connection to ensure it works
4. Save the connection
5. Double-click on any connection in the sidebar to open it in the database viewer
6. Use the viewer to explore schema and execute queries

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string for storing connection metadata

## Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run db:generate`: Generate database migrations
- `npm run db:migrate`: Run database migrations
- `npm run db:studio`: Open Drizzle Studio

## Security Notes

- Connection strings are stored in the database
- Consider encrypting sensitive connection strings in production
- Use environment variables for database credentials
