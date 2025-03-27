import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../../config.ts";
import AuthMiddleware from "../../../middlewares/auth.ts";

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
    const user = c.get("user");
    if (!user) return c.json({ error: "Invalid user" }, 401);

    const postId = c.req.param("id");
    const { data: post, error: fetchError } = await config.supabaseClient
      .from("publications")
      .select("user_id")
      .eq("id", postId)
      .single();

    if (fetchError || !post) return c.json({ error: "Post not found" }, 404);
    if (post.user_id !== user.uid)
      return c.json({ error: "User not authorized to delete this post" }, 403);

    const { error: deleteError } = await config.supabaseClient
      .from("publications")
      .delete()
      .eq("id", postId);

    if (deleteError) return c.json({ error: deleteError.message }, 500);

    return c.json({ message: "Post deleted successfully" }, 200);
  }
);

export default delete_post;
