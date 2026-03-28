module.exports = {
  openapi: "3.0.3",
  info: {
    title: "Auth Service API",
    version: "1.0.0",
    description: "Registration, login, session validation, and logout endpoints."
  },
  servers: [{ url: "http://app.myplatform.local:4000" }],
  tags: [{ name: "Auth" }],
  components: {
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string", format: "email" }
        }
      },
      AuthError: {
        type: "object",
        properties: {
          message: { type: "string" }
        }
      }
    }
  },
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        responses: {
          "200": { description: "Service healthy" }
        }
      }
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 6 }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Registered",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: { $ref: "#/components/schemas/User" }
                  }
                }
              }
            }
          },
          "400": { description: "Validation error" },
          "409": { description: "Email already exists" }
        }
      }
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Logged in",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: { $ref: "#/components/schemas/User" },
                    expiresAt: { type: "string", format: "date-time" }
                  }
                }
              }
            }
          },
          "401": { description: "Invalid credentials" }
        }
      }
    },
    "/api/auth/validate": {
      post: {
        tags: ["Auth"],
        summary: "Validate active session",
        responses: {
          "200": {
            description: "Session valid",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    authenticated: { type: "boolean" },
                    user: { $ref: "#/components/schemas/User" },
                    expiresAt: { type: "string", format: "date-time" }
                  }
                }
              }
            }
          },
          "401": {
            description: "Session invalid or expired",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthError" }
              }
            }
          }
        }
      }
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout and clear session",
        responses: {
          "200": { description: "Logged out" }
        }
      }
    }
  }
};
