import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import AuthMiddleware from "../../../middlewares/auth.ts";
import post_delete from "./publication_delete.ts";

const delete_post = new Hono();

delete_post.delete(
  "/:id",
  describeRoute({
    summary: "Delete a post",
    description:
      "Allows an authenticated user to delete one of their posts by ID.",
    tags: ["users-posts"],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "number", example: 1 },
      },
    ],
    responses: {
      200: {
        description: "Post deleted successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                message: {
                  type: "string",
                  default: "Post deleted successfully",
                },
              },
            },
          },
        },
      },
      401: {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: { type: "string", default: "Invalid user" },
              },
            },
          },
        },
      },
      403: {
        description: "Forbidden",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "string",
                  default: "User not authorized to delete this post",
                },
              },
            },
          },
        },
      },
      404: {
        description: "Post not found",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: { type: "string", default: "Post not found" },
              },
            },
          },
        },
      },
      500: {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: { type: "string", default: "Error message" },
              },
            },
          },
        },
      },
    },
  }),
  AuthMiddleware,
  async (c: any) => {
    return await post_delete(c);
  }
);

export default delete_post;
