# Passkey Node.js Server

A modern Node.js Express server with Sequelize ORM and SQLite database, supporting passkey-based authentication.

## Features

- **Express.js** - Fast and lightweight web framework
- **Sequelize ORM** - SQL-first database layer with migrations
- **SQLite** - Lightweight, file-based database
- **CORS** - Cross-Origin Resource Sharing enabled for all origins
- **ES6 Modules** - Full ES module support
- **Graceful Shutdown** - Proper cleanup on SIGINT/SIGTERM

## Project Structure

```
.
├── db/
│   ├── config.json              # Database configuration
│   ├── index.js                 # Database initialization and helpers
│   ├── migrations/              # Sequelize migrations
│   ├── models/                  # Sequelize models (User, Auth)
│   └── seeders/                 # Database seeders
├── server.js                    # Express server setup
├── index.js                     # Application entry point
├── package.json                 # Dependencies and scripts
└── database.sqlite              # SQLite database (generated)
```

## Installation

```bash
npm install
```

## Database Setup

### Run Migrations

Create the database tables:

```bash
npm run migrate
```

This will:
- Create the `Users` table (id, username, email, createdAt, updatedAt)
- Create the `Auths` table (id, userId, challenge, verified, createdAt)

### Seed Database (Optional)

If you have seeders configured, run:

```bash
npm run seed
```

### Undo Migrations

Rollback the last migration:

```bash
npm run migrate:undo
```

Rollback all migrations:

```bash
npm run migrate:undo:all
```

## Running the Server

### Development Mode

Start the server with file watching:

```bash
npm run dev
```

### Production Mode

Start the server normally:

```bash
npm start
```

The server will listen on `http://localhost:3000` (or the `PORT` environment variable).

## API Endpoints

### Health Check

```bash
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-16T12:00:00.000Z"
}
```

## Environment Variables

```bash
PORT=3000              # Server port (default: 3000)
NODE_ENV=development  # Environment (development, test, production)
```

## npm Scripts

```bash
npm start              # Start the server
npm run dev            # Start server with file watching
npm run migrate        # Run all pending migrations
npm run migrate:undo   # Undo last migration
npm test               # Run tests (placeholder)
```

## Notes

- The project uses **ES modules** (`"type": "module"` in `package.json`)
- CORS is enabled for all origins (`Access-Control-Allow-Origin: *`)
- Database uses SQLite for development and can be easily switched to PostgreSQL/MySQL by updating `db/config.json` and installing the appropriate driver
- Graceful shutdown is implemented for proper resource cleanup

## Database Configuration

Edit `db/config.json` to change database settings:

```json
{
  "development": {
    "dialect": "sqlite",
    "storage": "./database.sqlite"
  },
  "test": {
    "dialect": "sqlite",
    "storage": ":memory:"
  },
  "production": {
    "dialect": "sqlite",
    "storage": "./database.sqlite"
  }
}
```

## Troubleshooting

**Database locked error:**
- Ensure only one instance of the server is running
- Delete `database.sqlite` to start fresh: `rm database.sqlite && npm run migrate`

**Migration not found:**
- Ensure migrations are in `db/migrations/` directory
- Check `.sequelizerc` configuration

**Models not loading:**
- Verify model files are in `db/models/` and export a default function
- Check `db/models/index.js` for proper ES module syntax
