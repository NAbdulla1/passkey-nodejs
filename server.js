import express from 'express';
import cors from 'cors';
import { initializeDatabase, closeDatabase } from './db/index.js';
import { compareSync } from 'bcryptjs';
import cookieParser from 'cookie-parser';

export function createApp(models) {
  const app = express();

  // Enable CORS for all origins
  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }));

  // Parse JSON request bodies
  app.use(express.json());

  // Parse cookies
  app.use(cookieParser());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.post('/api/login-by-password', async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    const Users = models.User;
    if (!Users || typeof Users.findOne !== 'function') {
      return res.status(500).json({ error: 'User model not configured' });
    }

    try {
      const user = await Users.findOne({ where: { email }, include: [models.Auth] });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });

      let passwordMatches = false;

      // Support common property names: passwordHash or password
      const storedHash = user.Auth.password;
      if (!storedHash) {
        return res.status(500).json({ error: 'User\'s password is not found' });
      }

      passwordMatches = compareSync(password, storedHash);

      if (!passwordMatches) return res.status(401).json({ error: 'Invalid credentials' });

      // Create a simple token (replace with JWT or proper session management in production)
      const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
      // Set a secure HTTP-only cookie to mark the user as logged in
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: process.env.NODE_ENV === 'production'
          ? 7 * 24 * 60 * 60 * 1000 // 7 days
          : 5 * 60 * 1000, // 5 minutes
        path: '/',
      };
      res.cookie('session', token, cookieOptions);

      const safeUser = {
        id: user.id,
        email: user.email,
        username: user.username,
      };

      return res.json({ token, user: safeUser });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/logout', (req, res) => {
    // Clear the session cookie
    res.clearCookie('session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    res.json({ message: 'Logged out successfully' });
  });

  app.post('/api/is-logged-in', async (req, res) => {
    const sessionCookie = req.cookies ? req.cookies['session'] : null;
    if (!sessionCookie) {
      return res.json({ loggedIn: false });
    }

    try {
      const decoded = Buffer.from(sessionCookie, 'base64').toString('utf8');
      const [idPart, tsPart] = decoded.split(':');

      const userId = Number(idPart);
      const createdAt = Number(tsPart);

      if (!Number.isFinite(userId) || !Number.isFinite(createdAt)) {
        res.clearCookie('session', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
        });
        return res.json({ loggedIn: false });
      }

      const maxAgeMs = process.env.NODE_ENV === 'production'
        ? 7 * 24 * 60 * 60 * 1000 // 7 days
        : 5 * 60 * 1000; // 5 minutes

      if (Date.now() - createdAt > maxAgeMs) {
        res.clearCookie('session', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
        });
        return res.json({ loggedIn: false });
      }

      // Attach the parsed user id to the request for downstream use
      req.userId = userId;
      const user = await models.User.findOne({ where: { id: userId }});
      return res.json({ loggedIn: true, user });
    } catch (err) {
      res.clearCookie('session', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
      return res.json({ loggedIn: false });
    }
  });

  // fallback 404 for other routes
  app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  return app;
}

export async function startServer(port = process.env.PORT ? Number(process.env.PORT) : 3000) {
  // Initialize database
  const { models } = await initializeDatabase();

  const app = createApp(models);
  const server = app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });

  const shutdown = (signal) => {
    console.log(`Received ${signal}. Shutting down...`);
    closeDatabase().then(() => {
      server.close((err) => {
        if (err) {
          console.error('Error during shutdown:', err);
          process.exit(1);
        }
        console.log('Shutdown complete.');
        process.exit(0);
      });

      // Force exit if not closed in 10s
      setTimeout(() => {
        console.warn('Forcing shutdown.');
        process.exit(1);
      }, 10_000).unref();
    })
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  return { server, shutdown };
}

// Allow running directly for compatibility
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  startServer();
}
