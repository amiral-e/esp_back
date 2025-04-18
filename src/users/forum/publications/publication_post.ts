import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../../config.ts";
import AuthMiddleware from "../../../middlewares/auth.ts";

const create_post = new Hono();

create_post.post(
  "/",
  describeRoute({
    summary: "Create a new post",
    description:
      "Allows an authenticated user to create a new post in the database.",
    tags: ["users-posts"],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              title: { type: "string", example: "My first post" },
              content: { type: "string", example: "Hello world!" },
            },
            required: ["title", "content"],
          },
        },
      },
    },
    responses: {
      201: {
        description: "Post created successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                message: {
                  type: "string",
                  default: "Post created successfully",
                },
                post: {
                  type: "object",
                  properties: {
                    id: { type: "number" },
                    title: { type: "string" },
                    content: { type: "string" },
                    user_id: { type: "string" },
                    created_at: { type: "string" },
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
    const body = await c.req.json();
    const { title, content } = body;
    if (!title || !content)
      return c.json({ error: "Missing title or content" }, 400);
    const { data: postData, error: postError } = await config.supabaseClient
      .from("publications")
      .insert([{ title, content, user_id: user.uid }])
      .select("*")
      .single();

    if (postError) return c.json({ error: postError.message }, 500);

    return c.json(
      { message: "Post created successfully", post: postData },
      201
    );
  }
);

export default create_post;
