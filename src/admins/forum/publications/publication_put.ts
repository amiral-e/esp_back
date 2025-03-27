import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../../config.ts";
import AuthMiddleware from "../../../middlewares/auth.ts";

const update_post = new Hono();

update_post.put(
  "/:id",
  describeRoute({
    summary: "Update an existing post",
    description: "Allows an authenticated user to update a post in the database.",
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
                message: { type: "string", default: "Post updated successfully" },
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
                error: { type: "string", default: "Invalid JSON" },
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
    try {
      const user = c.get("user");
      if (!user) return c.json({ error: "Invalid user" }, 401);

      const { id } = await c.req.param();

      let json: any;
      try {
        json = await c.req.json();
        if (!json || !json.title || !json.content) {
          return c.json({ error: "Invalid JSON" }, 400);
        }
      } catch (error) {
        return c.json({ error: "Invalid JSON" }, 400);
      }

      // Vérifier si le post existe
      const post = await config.supabaseClient
        .from("publications")
        .select("*")
        .eq("id", id)
        .single();

      if (post.error || !post.data) {
        return c.json({ error: "Post not found" }, 404);
      }

      // Vérifier si l'utilisateur est le propriétaire du post
      if (post.data.user_id !== user.uid) {
        return c.json({ error: "Vous n'êtes pas autorisé à modifier ce post" }, 403);
      }

      // Mettre à jour le post
      const update = await config.supabaseClient
        .from("publications")
        .update({
          title: json.title,
          content: json.content,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.uid)
        .select("*")
        .single();

      if (update.error) {
        return c.json({ error: update.error.message }, 500);
      }

      return c.json(
        { message: "Post updated successfully", post: update.data },
        200
      );
    } catch (error) {
      console.error("Unexpected error:", error);
      return c.json({ error: "Une erreur inattendue s'est produite" }, 500);
    }
  }
);

export default update_post;
