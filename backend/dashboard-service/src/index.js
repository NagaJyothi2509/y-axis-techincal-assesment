const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const swaggerUi = require("swagger-ui-express");
require("dotenv").config();
const openapiSpec = require("./openapi");

const app = express();
const PORT = process.env.PORT || 5001;
const {
  DASHBOARD_ORIGIN = "http://localhost:3002",
  AUTH_SERVICE_URL = "http://localhost:4000",
  COOKIE_NAME = "myplatform_sid",
  APP_LOGIN_URL = "http://localhost:3001/login"
} = process.env;

app.use(
  cors({
    origin: DASHBOARD_ORIGIN,
    credentials: true
  })
);
app.use(express.json());

async function validateSession(req) {
  const cookieHeader = req.headers.cookie || "";
  const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader
    }
  });

  if (!response.ok) {
    throw new Error("Unauthenticated");
  }
  return response.json();
}

async function authMiddleware(req, res, next) {
  try {
    const hasCookie = (req.headers.cookie || "").includes(`${COOKIE_NAME}=`);
    if (!hasCookie) {
      return res.status(401).json({ message: "No session. Please login.", loginUrl: APP_LOGIN_URL });
    }
    const validation = await validateSession(req);
    req.user = validation.user;
    return next();
  } catch (err) {
    console.error("Dashboard auth middleware failed:", err.message);
    return res.status(401).json({ message: "Session invalid or expired.", loginUrl: APP_LOGIN_URL });
  }
}

app.get("/health", (_req, res) => {
  res.json({ service: "dashboard", ok: true });
});

app.get("/openapi.json", (_req, res) => {
  res.json(openapiSpec);
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.use("/api/dashboard", authMiddleware);

app.get("/api/dashboard/me", (req, res) => {
  res.json({ user: req.user });
});

app.get("/api/dashboard/overview", (req, res) => {
  res.json({
    cards: [
      { label: "Total Orders", value: 1420 },
      { label: "Revenue", value: "$87,320" },
      { label: "Active Users", value: 312 }
    ],
    activity: [
      `${req.user.name} viewed weekly report`,
      "3 new orders in the last hour",
      "Marketing campaign CTR up by 4.1%"
    ]
  });
});

app.get("/api/dashboard/settings", (req, res) => {
  res.json({
    profile: {
      name: req.user.name,
      email: req.user.email
    },
    preferences: {
      theme: "light",
      notifications: true
    }
  });
});

app.listen(PORT, () => {
  console.log("Dashboard service running on port", PORT);
});
