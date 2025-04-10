import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  console.log("Comparing passwords, supplied length:", supplied.length);
  console.log("Stored password hash:", stored);
  
  try {
    const [hashed, salt] = stored.split(".");
    console.log("Extracted hash and salt:", { hashedLength: hashed.length, saltLength: salt.length });
    
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    
    // Debug info - hash the supplied password with the stored salt
    console.log("Supplied password hash buffer length:", suppliedBuf.length);
    console.log("Stored password hash buffer length:", hashedBuf.length);
    
    const result = timingSafeEqual(hashedBuf, suppliedBuf);
    console.log("Password comparison result:", result);
    return result;
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: "jamaluki-salon-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: false,
      httpOnly: true
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Extended register schema with validation
  const registerSchema = insertUserSchema.extend({
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      console.log("Received registration request:", req.body);
      
      // Validate request data
      try {
        const validatedData = registerSchema.parse(req.body);
        console.log("Validation passed for registration data");
        
        // Check if username already exists
        const existingUser = await storage.getUserByUsername(validatedData.username);
        if (existingUser) {
          console.log("Registration failed: Username already exists");
          return res.status(400).json({ message: "Username already exists" });
        }

        // Create user with hashed password
        console.log("Creating new user...");
        const hashedPassword = await hashPassword(validatedData.password);
        
        const userData = {
          ...validatedData,
          password: hashedPassword,
          // Set default values for nullable fields
          email: validatedData.email || null,
          imageUrl: null,
          preferredLanguage: validatedData.preferredLanguage || "ar",
          isPrivacyFocused: validatedData.isPrivacyFocused || false,
          prefersFemaleStaff: validatedData.prefersFemaleStaff || false
        };
        
        console.log("Creating user with data:", { ...userData, password: "[REDACTED]" });
        const user = await storage.createUser(userData);
        console.log("User created successfully, ID:", user.id);

        // Remove sensitive fields
        const { password, ...safeUser } = user;

        // Log in the user
        req.login(user, (err) => {
          if (err) {
            console.error("Login error after registration:", err);
            return next(err);
          }
          console.log("User logged in after registration");
          res.status(201).json(safeUser);
        });
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          console.log("Registration validation error:", validationError.errors);
          return res.status(400).json({ 
            message: "Validation error", 
            errors: validationError.errors 
          });
        }
        throw validationError;
      }
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed", error: error.message });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid username or password" });

      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        
        // Remove sensitive fields
        const { password, ...safeUser } = user;
        res.status(200).json(safeUser);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    // Remove sensitive fields
    const { password, ...safeUser } = req.user;
    res.json(safeUser);
  });
}
