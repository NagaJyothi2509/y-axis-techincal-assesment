const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const swaggerUi = require("swagger-ui-express");
require("dotenv").config();
const openapiSpec = require("./openapi");

const app = express();
const PORT = process.env.PORT || 5002;
const {
  STORE_ORIGIN = "http://localhost:3003",
  AUTH_SERVICE_URL = "http://localhost:4000",
  COOKIE_NAME = "myplatform_sid",
  APP_LOGIN_URL = "http://localhost:3001/login"
} = process.env;

app.use(
  cors({
    origin: STORE_ORIGIN,
    credentials: true
  })
);
app.use(express.json());

const products = [
  { id: 1, name: "Wireless Headphones", price: 129, description: "Noise-cancelling over-ear headset." },
  { id: 2, name: "Mechanical Keyboard", price: 99, description: "RGB keyboard with tactile switches." },
  { id: 3, name: "4K Monitor", price: 349, description: "27-inch IPS monitor for creators." },
  { id: 4, name: "USB-C Dock", price: 79, description: "Multi-port dock with HDMI and Ethernet." },
  { id: 5, name: "Laptop Stand", price: 39, description: "Ergonomic adjustable aluminum stand." },
  { id: 6, name: "Webcam Pro", price: 89, description: "1080p webcam with auto-focus." }
];

const cartsByUser = new Map();

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
    console.error("Store auth middleware failed:", err.message);
    return res.status(401).json({ message: "Session invalid or expired.", loginUrl: APP_LOGIN_URL });
  }
}

function getCart(userId) {
  if (!cartsByUser.has(userId)) {
    cartsByUser.set(userId, []);
  }
  return cartsByUser.get(userId);
}

app.get("/health", (_req, res) => {
  res.json({ service: "store", ok: true });
});

app.get("/openapi.json", (_req, res) => {
  res.json(openapiSpec);
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.use("/api/store", authMiddleware);

app.get("/api/store/me", (req, res) => {
  res.json({ user: req.user });
});

app.get("/api/store/products", (_req, res) => {
  res.json({ products });
});

app.get("/api/store/products/:id", (req, res) => {
  const product = products.find((p) => p.id === Number(req.params.id));
  if (!product) {
    return res.status(404).json({ message: "Product not found." });
  }
  return res.json({ product });
});

app.get("/api/store/cart", (req, res) => {
  const cart = getCart(req.user.id);
  return res.json({ cart });
});

app.post("/api/store/cart", (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const product = products.find((p) => p.id === Number(productId));
  if (!product) {
    return res.status(404).json({ message: "Product not found." });
  }

  const cart = getCart(req.user.id);
  const existing = cart.find((item) => item.product.id === product.id);
  if (existing) {
    existing.quantity += Number(quantity) || 1;
  } else {
    cart.push({ product, quantity: Number(quantity) || 1 });
  }
  return res.status(201).json({ cart });
});

app.delete("/api/store/cart/:productId", (req, res) => {
  const productId = Number(req.params.productId);
  const cart = getCart(req.user.id);
  const filtered = cart.filter((item) => item.product.id !== productId);
  cartsByUser.set(req.user.id, filtered);
  return res.json({ cart: filtered });
});

app.listen(PORT, () => {
  console.log("Store service running on port", PORT);
});
