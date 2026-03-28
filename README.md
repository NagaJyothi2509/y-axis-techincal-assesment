# y-axis-techincal-assesment

# Multi-App Platform with Shared Authentication (MERN)

This repository implements a multi-app platform where authentication is shared across three subdomains:

- Main app: `app.myplatform.local`
- Dashboard app: `dashboard.myplatform.local`
- Store app: `store.myplatform.local`

Each frontend and backend service has its own folder and its own `package.json`.

## Folder Structure

```txt
backend/
  auth-service/
  dashboard-service/
  store-service/
frontend/
  app-frontend/
  dashboard-frontend/
  store-frontend/
```

## Architecture Overview

### Backend Services

1. **Auth Service** (`http://localhost:4000`)
- Handles registration, login, session validation, and logout.
- Stores users and sessions in MongoDB.
- Issues an `HttpOnly` session cookie with `domain=.myplatform.local`.

2. **Dashboard Service** (`http://localhost:5001`)
- Exposes protected dashboard endpoints only.
- Validates session by calling Auth Service `POST /api/auth/validate` and forwarding cookie header.
- Returns mock overview cards, activity feed, and settings data.

3. **Store Service** (`http://localhost:5002`)
- Exposes protected store endpoints only.
- Validates session through Auth Service.
- Returns mock product list/detail and in-memory cart operations.

### Frontend Apps

1. **Main App Frontend** (`http://app.myplatform.local:3001`)
- Landing page, register form, login form.
- Authenticated home page with navigation links to Dashboard and Store.
- Global logout action.

2. **Dashboard Frontend** (`http://dashboard.myplatform.local:3002`)
- Protected app.
- Internal routes: `overview`, `settings`.
- Shows welcome text with logged-in user name + mock summary cards/activity.

3. **Store Frontend** (`http://store.myplatform.local:3003`)
- Protected app.
- Internal routes: product list, product detail, cart.
- Includes add-to-cart / remove-from-cart flow.

## Authentication Strategy

This implementation uses **stateful server-side sessions** with a shared `HttpOnly` cookie.

- Cookie name: `myplatform_sid`
- Cookie domain: `.myplatform.local`
- Session persistence: MongoDB `sessions` collection with TTL index

### Why this approach

- Cross-subdomain SSO is straightforward with one domain-scoped cookie.
- `HttpOnly` cookie avoids exposing auth tokens to JavaScript.
- Auth Service is the single source of truth for login, validation, and logout.

### Trade-offs

- Extra hop: Dashboard/Store call Auth Service for session validation.
- Stateful session store adds DB dependency for request auth.
- Current cart storage is in-memory (acceptable for assessment, not production).

## Assumptions

- Local development uses HTTP and `secure=false` cookie.
- Session policy is single active session per user (new login invalidates old session for that user).
- Redirect source for unauthenticated users is always the main app login page.

## Prerequisites

- Node.js + npm
- MongoDB (local or Atlas)

## /etc/hosts Setup (Required)

Add these entries to your local `/etc/hosts` file so subdomains resolve to your machine:

```txt
127.0.0.1 app.myplatform.local
127.0.0.1 dashboard.myplatform.local
127.0.0.1 store.myplatform.local
```

Open the apps with:

- `http://app.myplatform.local:3001`
- `http://dashboard.myplatform.local:3002`
- `http://store.myplatform.local:3003`

## Environment Setup

Copy each `.env.example` to `.env`:

- `backend/auth-service/.env.example`
- `backend/dashboard-service/.env.example`
- `backend/store-service/.env.example`
- `frontend/app-frontend/.env.example`
- `frontend/dashboard-frontend/.env.example`
- `frontend/store-frontend/.env.example`

## Install

```bash
cd backend/auth-service && npm install
cd ../dashboard-service && npm install
cd ../store-service && npm install

cd ../../frontend/app-frontend && npm install
cd ../dashboard-frontend && npm install
cd ../store-frontend && npm install
```

## Run (6 Terminals)

```bash
# Terminal 1
cd backend/auth-service && npm run dev

# Terminal 2
cd backend/dashboard-service && npm run dev

# Terminal 3
cd backend/store-service && npm run dev

# Terminal 4
cd frontend/app-frontend && npm start

# Terminal 5
cd frontend/dashboard-frontend && npm start

# Terminal 6
cd frontend/store-frontend && npm start
```

## API Documentation (Swagger)

Each backend service exposes:

- `GET /openapi.json` (OpenAPI spec JSON)
- `GET /api-docs` (Swagger UI)

Open in browser:

- Auth Service: `http://app.myplatform.local:4000/api-docs`
- Dashboard Service: `http://dashboard.myplatform.local:5001/api-docs`
- Store Service: `http://store.myplatform.local:5002/api-docs`


## What I Would Improve with More Time

- Use Redis for sessions and cart state.
- Add Dockerfiles + `docker-compose.yml` for one-command startup.
- Add reverse proxy (NGINX/Traefik) to handle subdomain routing in one entrypoint.
- Add shared UI package used by all frontends.
