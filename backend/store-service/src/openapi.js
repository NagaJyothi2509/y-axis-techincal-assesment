module.exports = {
  openapi: "3.0.3",
  info: {
    title: "Store Service API",
    version: "1.0.0",
    description: "Protected store APIs for products and cart operations."
  },
  servers: [{ url: "http://store.myplatform.local:5002" }],
  tags: [{ name: "Store" }],
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        responses: {
          "200": { description: "Service healthy" }
        }
      }
    },
    "/api/store/me": {
      get: {
        tags: ["Store"],
        summary: "Current authenticated user",
        responses: {
          "200": { description: "User info" },
          "401": { description: "Unauthenticated" }
        }
      }
    },
    "/api/store/products": {
      get: {
        tags: ["Store"],
        summary: "List products",
        responses: {
          "200": { description: "Products list" },
          "401": { description: "Unauthenticated" }
        }
      }
    },
    "/api/store/products/{id}": {
      get: {
        tags: ["Store"],
        summary: "Get product by id",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" }
          }
        ],
        responses: {
          "200": { description: "Product detail" },
          "401": { description: "Unauthenticated" },
          "404": { description: "Product not found" }
        }
      }
    },
    "/api/store/cart": {
      get: {
        tags: ["Store"],
        summary: "Get current user cart",
        responses: {
          "200": { description: "Cart payload" },
          "401": { description: "Unauthenticated" }
        }
      },
      post: {
        tags: ["Store"],
        summary: "Add product to cart",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["productId"],
                properties: {
                  productId: { type: "integer" },
                  quantity: { type: "integer", default: 1 }
                }
              }
            }
          }
        },
        responses: {
          "201": { description: "Cart updated" },
          "401": { description: "Unauthenticated" },
          "404": { description: "Product not found" }
        }
      }
    },
    "/api/store/cart/{productId}": {
      delete: {
        tags: ["Store"],
        summary: "Remove product from cart",
        parameters: [
          {
            name: "productId",
            in: "path",
            required: true,
            schema: { type: "integer" }
          }
        ],
        responses: {
          "200": { description: "Cart updated" },
          "401": { description: "Unauthenticated" }
        }
      }
    }
  }
};
