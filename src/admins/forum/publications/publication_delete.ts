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
      "Allows an authenticated user to delete a post from the database.",
    tags: ["users-posts"],
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

    const { id } = c.req.param();

    const { data: existingPost, error: fetchError } =
      await config.supabaseClient
        .from("publications")
        .select("id", "user_id")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

    if (fetchError || !existingPost)
      return c.json({ error: "Post not found" }, 404);

    const { error: deleteError } = await config.supabaseClient
      .from("publications")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) return c.json({ error: deleteError.message }, 500);

    return c.json({ message: "Post deleted successfully" }, 200);
  }
);

export default delete_post;
