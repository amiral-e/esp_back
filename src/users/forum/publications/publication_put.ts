import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../../config.ts";
import AuthMiddleware from "../../../middlewares/auth.ts";

const update_post = new Hono();

update_post.put(
  "/:id",
  describeRoute({
    summary: "Update an existing post",
    description:
      "Allows an authenticated user to update a post in the database.",
    tags: ["users-posts"],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              title: { type: "string", example: "Updated title" },
              content: { type: "string", example: "Updated content" },
            },
            required: ["title", "content"],
          },
        },
      },
    },
    responses: {
      200: {
        description: "Post updated successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                message: {
                  type: "string",
                  default: "Post updated successfully",
                },
                post: {
                  type: "object",
                  properties: {
                    id: { type: "number" },
                    title: { type: "string" },
                    content: { type: "string" },
                    user_id: { type: "string" },
                    updated_at: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
      400: {
        description: "Bad request",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: { type: "string", default: "Missing title or content" },
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
    const { title, content } = await c.req.json();
    if (!title || !content)
      return c.json({ error: "Missing title or content" }, 400);

    const { data: existingPost, error: fetchError } =
      await config.supabaseClient
        .from("publications")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

    if (fetchError || !existingPost)
      return c.json({ error: "Post not found" }, 404);

    const { data: updatedPost, error: updateError } =
      await config.supabaseClient
        .from("publications")
        .update({ title, content, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id)
        .select("*")
        .single();

    if (updateError) return c.json({ error: updateError.message }, 500);

    return c.json(
      { message: "Post updated successfully", post: updatedPost },
      200
    );
  }
);

export default update_post;
