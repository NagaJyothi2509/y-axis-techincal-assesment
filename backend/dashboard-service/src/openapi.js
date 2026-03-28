module.exports = {
  openapi: "3.0.3",
  info: {
    title: "Dashboard Service API",
    version: "1.0.0",
    description: "Protected dashboard APIs for overview and settings."
  },
  servers: [{ url: "http://dashboard.myplatform.local:5001" }],
  tags: [{ name: "Dashboard" }],
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        responses: {
          "200": { description: "Service healthy" }
        }
      }
    },
    "/api/dashboard/me": {
      get: {
        tags: ["Dashboard"],
        summary: "Current authenticated user",
        responses: {
          "200": { description: "User info" },
          "401": { description: "Unauthenticated" }
        }
      }
    },
    "/api/dashboard/overview": {
      get: {
        tags: ["Dashboard"],
        summary: "Overview cards and activity feed",
        responses: {
          "200": { description: "Overview payload" },
          "401": { description: "Unauthenticated" }
        }
      }
    },
    "/api/dashboard/settings": {
      get: {
        tags: ["Dashboard"],
        summary: "Dashboard settings payload",
        responses: {
          "200": { description: "Settings payload" },
          "401": { description: "Unauthenticated" }
        }
      }
    }
  }
};
