// @ts-check
import express from 'express';
import cors from 'cors';
import { initializeDatabase, closeDatabase } from './db/index.js';
import { compareSync } from 'bcryptjs';
import cookieParser from 'cookie-parser';
import { generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse } from '@simplewebauthn/server';

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

      return actionsAfterUserAuthentication(user, res);
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
      const user = await models.User.findOne({ where: { id: userId } });
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

  app.post('/api/generate-passkey-challenge', async (req, res) => {
    const email = req.body.email;
    if (!email) {
      return res.status(400).json({ error: 'Missing user identifier' });
    }

    const user = await models.User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const passKeys = await models.PassKey.findAll({ where: { userId: user.id } });
    const existingCredentials = passKeys
      .filter(passKey => passKey.credentialId)
      .map(passKey => ({
        id: passKey.credentialId,
        transports: passKey.credentialTransports,
      }));

    console.log('Existing Credentials:', existingCredentials);

    const options = await generateRegistrationOptions({
      rpID: 'localhost',
      rpName: 'My Passkey App',
      userName: email,
      userID: Buffer.from(`${user.id}`),
      timeout: 60000,
      userDisplayName: `User: ${user.username}`,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'required',
        authenticatorAttachment: 'platform',
      },
      excludeCredentials: existingCredentials
    });

    if (!options || !options.challenge) {
      return res.status(500).json({ error: 'Failed to generate registration options' });
    }

    const challenge = options.challenge;

    // instead of storing it in a database we can store it in memory or use something like Redis with auto expiry
    const passKey = await models.PassKey.create({
      userId: user.id,
      challenge,
    });

    return res.json({ passKeyId: passKey.id, userId: user.id, options });
  });

  app.post('/api/verify-passkey-registration', async (req, res) => {
    const { passKeyId, userId, attestationResponse, error } = req.body || {};

    // there will be an error if user cancels or tries to create multiple keys
    if (error) {
      console.log('Passkey registration error:', error);
      await models.PassKey.destroy({ where: { id: passKeyId } });
      return res.json({ error: 'Passkey registration was cancelled or failed' });
    }

    if (!userId || !attestationResponse || !passKeyId) {
      return res.status(400).json({ error: 'Missing userId or attestationResponse' });
    }

    const passKey = await models.PassKey.findByPk(passKeyId);
    if (!passKey || passKey.userId !== userId) {
      return res.status(400).json({ error: 'Invalid PassKey record' });
    }

    const verification = await verifyRegistrationResponse({
      response: attestationResponse,
      expectedChallenge: passKey.challenge, // Retrieve the challenge you sent to the client
      expectedOrigin: 'http://localhost:5173',
      expectedRPID: 'localhost',
    });

    if (!verification.verified) {
      return res.status(400).json({ error: 'Passkey registration verification failed' });
    }

    const { registrationInfo } = verification;

    const { credential, credentialDeviceType, credentialBackedUp } = registrationInfo;

    await passKey.update({
      credentialId: credential.id,
      credentialCounter: credential.counter,
      credentialPublicKey: Buffer.from(credential.publicKey).toString('base64'),
      credentialTransports: credential.transports,
      credentialDeviceType: credentialDeviceType,
      credentialBackedUp: credentialBackedUp
    });

    return res.json({ success: true });
  });

  app.post('/api/generate-authentication-challenge', async (req, res) => {
    const email = req.body.email;
    if (!email) {
      return res.status(400).json({ error: 'Missing user identifier' });
    }

    const user = await models.User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const passKeys = await models.PassKey.findAll({ where: { userId: user.id } });
    const existingCredentials = passKeys
      .filter(passKey => !!passKey.credentialId)
      .map(passKey => ({
        id: passKey.credentialId,
        transports: passKey.credentialTransports,
      }));

    if (existingCredentials.length === 0) {
      return res.status(400).json({ error: 'No registered passkeys found for this user' });
    }

    const challengeOptions = await generateAuthenticationOptions({
      timeout: 60000,
      rpID: 'localhost',
      allowCredentials: existingCredentials,
      userVerification: 'required',
    });

    if (!challengeOptions || !challengeOptions.challenge) {
      return res.status(500).json({ error: 'Failed to generate authentication options' });
    }

    const challenge = challengeOptions.challenge;

    // instead of storing it in a database we can store it in memory or use something like Redis with auto expiry
    const passKey = await models.PassKey.create({
      userId: user.id,
      challenge,
    });

    return res.json({ passKeyId: passKey.id, userId: user.id, options: challengeOptions });
  });

  app.post('/api/verify-passkey-authentication', async (req, res) => {
    const { passKeyId, userId, assertionResponse, error } = req.body || {};

    // there will be an error if user cancels
    if (error) {
      console.log('Passkey authentication error:', error);
      await models.PassKey.destroy({ where: { id: passKeyId } });
      return res.json({ error: 'Passkey authentication was cancelled or failed' });
    }

    if (!userId || !assertionResponse || !passKeyId) {
      return res.status(400).json({ error: 'Missing userId or assertionResponse' });
    }

    const currentPassKey = await models.PassKey.findByPk(passKeyId);
    if (!currentPassKey || currentPassKey.userId !== userId) {
      return res.status(400).json({ error: 'Invalid PassKey record' });
    }

    const currentChallenge = currentPassKey.challenge;
    // for login we only need the challenge, so delete the login passkey row as it's no longer needed
    await models.PassKey.destroy({ where: { id: passKeyId } });

    const authenticatedPasskey = await models.PassKey.findOne({ where: { userId, credentialId: assertionResponse.id } });
    if (!authenticatedPasskey) {
      return res.status(400).json({ error: 'No registered passkey found matching the assertion' });
    }

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: assertionResponse,
        expectedChallenge: currentChallenge, // Retrieve the challenge you sent to the client
        expectedOrigin: 'http://localhost:5173',
        expectedRPID: 'localhost',
        credential: {
          id: authenticatedPasskey.credentialId,
          publicKey: Buffer.from(authenticatedPasskey.credentialPublicKey, 'base64'),
          counter: authenticatedPasskey.credentialCounter,
          transports: authenticatedPasskey.credentialTransports,
        }
      });
    } catch (err) {
      console.error('Error during passkey authentication verification:', err);
      return res.status(500).json({ error: 'Internal server error during verification' });
    }

    if (!verification.verified) {
      return res.status(400).json({ error: 'Passkey authentication verification failed' });
    }

    const { authenticationInfo } = verification;
    const { newCounter } = authenticationInfo;
    await authenticatedPasskey.update({
      credentialCounter: newCounter,
    });

    return actionsAfterUserAuthentication(await models.User.findByPk(userId), res);
  });

  app.get('/api/passkeys', async (req, res) => {
    const sessionCookie = req.cookies ? req.cookies['session'] : null;
    if (!sessionCookie) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    let userId;
    try {
      const decoded = Buffer.from(sessionCookie, 'base64').toString('utf8');
      const [idPart] = decoded.split(':');
      userId = Number(idPart);
      if (!Number.isFinite(userId)) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
    } catch (err) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    let passKeys = await models.PassKey.findAll({ where: { userId } });
    passKeys = passKeys
      .filter(passKey => !!passKey.credentialId)
      .map(passKey => ({
        id: passKey.id,
        createdAt: passKey.createdAt,
        lastUsedAt: passKey.updatedAt,
      }));

      return res.json(passKeys);
  });

  // fallback 404 for other routes
  app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  return app;

  function actionsAfterUserAuthentication(user, res) {
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
  }
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
