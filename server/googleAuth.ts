import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import MemoryStore from "memorystore";
import ConnectPgSimple from "connect-pg-simple";
import { storage } from "./storage";

// Validate required environment variables
if (!process.env.GOOGLE_CLIENT_ID) {
  console.error("ERROR: GOOGLE_CLIENT_ID environment variable not provided");
  throw new Error("Environment variable GOOGLE_CLIENT_ID not provided");
}

if (!process.env.GOOGLE_CLIENT_SECRET) {
  console.error("ERROR: GOOGLE_CLIENT_SECRET environment variable not provided");
  throw new Error("Environment variable GOOGLE_CLIENT_SECRET not provided");
}

if (!process.env.SESSION_SECRET) {
  console.error("ERROR: SESSION_SECRET environment variable not provided");
  throw new Error("Environment variable SESSION_SECRET not provided");
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  try {
    // Use PostgreSQL for persistent session storage in production
    if (process.env.NODE_ENV === 'production') {
      console.log("Setting up PostgreSQL session store for production");
      const PgSession = ConnectPgSimple(session);
      const sessionStore = new PgSession({
        // Use existing database connection through a pool
        conString: process.env.DATABASE_URL || 
          `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}?sslmode=require`,
        tableName: 'sessions',
        createTableIfMissing: false, // Table already exists in schema
      });
      
      return session({
        secret: process.env.SESSION_SECRET!,
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
        cookie: {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          maxAge: sessionTtl,
        },
      });
    } else {
      console.log("Setting up memory session store for development");
      // Use memory store in development for easier debugging
      const MemoryStoreSession = MemoryStore(session);
      const sessionStore = new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      });
      
      return session({
        secret: process.env.SESSION_SECRET!,
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
        cookie: {
          httpOnly: true,
          secure: false,
          maxAge: sessionTtl,
        },
      });
    }
  } catch (error) {
    console.error("ERROR: Failed to set up session configuration:", error);
    throw error;
  }
}

async function upsertUser(profile: any) {
  try {
    console.log("Upserting user with Google profile:", {
      id: profile.id,
      email: profile.emails?.[0]?.value,
      name: profile.displayName
    });

    await storage.upsertUser({
      id: profile.id,
      email: profile.emails?.[0]?.value || '',
      firstName: profile.name?.givenName || '',
      lastName: profile.name?.familyName || '',
      profileImageUrl: profile.photos?.[0]?.value || '',
    });
    
    console.log("Successfully upserted user with ID:", profile.id);
  } catch (error) {
    console.error("ERROR: Failed to upsert user:", error);
    throw error;
  }
}

export async function setupGoogleAuth(app: Express) {
  try {
    console.log("Setting up Google OAuth authentication...");
    
    app.set("trust proxy", 1);
    app.use(getSession());
    app.use(passport.initialize());
    app.use(passport.session());

    // Determine callback URL based on environment
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost'}`
      : `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || '0.0.0.0:5000'}`;
    
    const callbackURL = `${baseUrl}/api/auth/google/callback`;
    
    console.log("Google OAuth callback URL:", callbackURL);

    // Configure Google OAuth Strategy
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: callbackURL
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google OAuth callback received for user:", profile.displayName);
        
        await upsertUser(profile);
        
        // Create user session object
        const user = {
          id: profile.id,
          profile: profile,
          access_token: accessToken,
          refresh_token: refreshToken,
        };
        
        console.log("Google OAuth authentication successful for user:", profile.id);
        return done(null, user);
      } catch (error) {
        console.error("ERROR: Google OAuth authentication failed:", error);
        return done(error, false);
      }
    }));

    // Serialize user for session
    passport.serializeUser((user: any, done) => {
      try {
        console.log("Serializing user for session:", user.id);
        done(null, user.id);
      } catch (error) {
        console.error("ERROR: Failed to serialize user:", error);
        done(error, false);
      }
    });

    // Deserialize user from session
    passport.deserializeUser(async (id: string, done) => {
      try {
        console.log("Deserializing user from session:", id);
        const user = await storage.getUser(id);
        if (user) {
          console.log("Successfully deserialized user:", user.email);
          done(null, { id, profile: user });
        } else {
          console.log("User not found during deserialization:", id);
          done(null, false);
        }
      } catch (error) {
        console.error("ERROR: Failed to deserialize user:", error);
        done(error, false);
      }
    });

    // Google OAuth routes
    app.get("/api/login", (req, res, next) => {
      console.log("Initiating Google OAuth login");
      passport.authenticate('google', {
        scope: ['profile', 'email']
      })(req, res, next);
    });

    app.get("/api/auth/google/callback", 
      passport.authenticate('google', { 
        failureRedirect: '/api/login?error=auth_failed',
      }),
      (req, res) => {
        try {
          console.log("Google OAuth callback successful, redirecting user");
          res.redirect('/');
        } catch (error) {
          console.error("ERROR: Failed to redirect after successful auth:", error);
          res.redirect('/api/login?error=redirect_failed');
        }
      }
    );

    app.get("/api/logout", (req, res) => {
      try {
        console.log("User logout requested");
        req.logout(() => {
          console.log("User successfully logged out");
          res.redirect('/');
        });
      } catch (error) {
        console.error("ERROR: Failed to logout user:", error);
        res.status(500).json({ message: "Logout failed" });
      }
    });

    console.log("Google OAuth authentication setup completed successfully");
  } catch (error) {
    console.error("ERROR: Failed to setup Google OAuth authentication:", error);
    throw error;
  }
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      console.log("Authentication check failed: user not authenticated");
      return res.status(401).json({ message: "Unauthorized" });
    }

    console.log("Authentication check passed for user:", (req.user as any).id);
    return next();
  } catch (error) {
    console.error("ERROR: Authentication middleware failed:", error);
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};