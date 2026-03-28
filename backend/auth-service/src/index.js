const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const swaggerUi = require("swagger-ui-express");
require("dotenv").config();

const User = require("./models/User");
const Session = require("./models/Session");
const openapiSpec = require("./openapi");

const app = express();
const PORT = process.env.PORT || 4000;
const {
  MONGO_URI = "mongodb://127.0.0.1:27017/myplatform",
  COOKIE_NAME = "myplatform_sid",
  COOKIE_DOMAIN = ".myplatform.local",
  SESSION_TTL_MINUTES = "1",
  APP_ORIGIN = "http://localhost:3001",
  DASHBOARD_ORIGIN = "http://localhost:3002",
  STORE_ORIGIN = "http://localhost:3003"
} = process.env;

const additionalAllowedOrigins = (process.env.ADDITIONAL_ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [
  APP_ORIGIN,
  DASHBOARD_ORIGIN,
  STORE_ORIGIN,
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  ...additionalAllowedOrigins
];

app.use(
  cors({
    origin: function (origin, cb) {
      if (!origin || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      return cb(null, false);
    },
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: false,
  domain: COOKIE_DOMAIN,
  path: "/"
};

function buildExpiry() {
  return new Date(Date.now() + Number(SESSION_TTL_MINUTES) * 60 * 1000);
}

function sanitizeUser(userDoc) {
  return {
    id: userDoc._id.toString(),
    name: userDoc.name,
    email: userDoc.email
  };
}

app.get("/health", (_req, res) => {
  res.json({ service: "auth", ok: true });
});

app.get("/openapi.json", (_req, res) => {
  res.json(openapiSpec);
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: "Email already registered." });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const createdUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash
    });

    return res.status(201).json({ user: sanitizeUser(createdUser) });
  } catch (err) {
    return res.status(500).json({ message: "Registration failed.", error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const sessionId = uuidv4();
    const expiresAt = buildExpiry();

    await Session.deleteMany({ userId: user._id });
    await Session.create({ sessionId, userId: user._id, expiresAt });

    res.cookie(COOKIE_NAME, sessionId, {
      ...cookieOptions,
      expires: expiresAt
    });

    return res.json({ user: sanitizeUser(user), expiresAt });
  } catch (err) {
    return res.status(500).json({ message: "Login failed.", error: err.message });
  }
});

app.post("/api/auth/validate", async (req, res) => {
  try {
    const sessionId = req.cookies[COOKIE_NAME];
    if (!sessionId) {
      return res.status(401).json({ message: "Missing session." });
    }

    const session = await Session.findOne({ sessionId }).populate("userId");
    if (!session) {
      return res.status(401).json({ message: "Invalid session." });
    }

    if (session.expiresAt.getTime() < Date.now()) {
      await Session.deleteOne({ _id: session._id });
      res.clearCookie(COOKIE_NAME, cookieOptions);
      return res.status(401).json({ message: "Session expired." });
    }

    return res.json({ authenticated: true, user: sanitizeUser(session.userId), expiresAt: session.expiresAt });
  } catch (err) {
    return res.status(500).json({ message: "Validation failed.", error: err.message });
  }
});

app.post("/api/auth/logout", async (req, res) => {
  try {
    const sessionId = req.cookies[COOKIE_NAME];
    if (sessionId) {
      await Session.deleteOne({ sessionId });
    }
    res.clearCookie(COOKIE_NAME, cookieOptions);
    return res.json({ message: "Logged out." });
  } catch (err) {
    return res.status(500).json({ message: "Logout failed.", error: err.message });
  }
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log("Auth service running on port", PORT);
    });
  })
  .catch((err) => {
    console.error("Mongo connection failed:", err.message);
    process.exit(1);
  });
