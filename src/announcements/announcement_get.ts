import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import config from "../config";

const announcement_get = new Hono();

announcement_get.get(
  "/",
  describeRoute({
    summary: "Get all announcements",
    description: "Retrieve all announcements",
    responses: {
      200: {
        description: "Successfully retrieved announcements",
        content: {
          "application/json": {
            schema: {
              type: "array",
              items: { $ref: "#/components/schemas/AnnouncementResponse" },
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
                error: {
                  type: "string",
                  default: "Error message",
                },
              },
            },
          },
        },
      },
    },
  }),
  async (c) => {
    const { data, error } = await config.supabaseClient
      .from("announcements")
      .select("*");

    if (error) throw new Error(error.message);
    return c.json(data);
  }
);

announcement_get.get(
  "/:id",
  describeRoute({
    summary: "Get announcement by ID",
    description: "Retrieve a specific announcement by its ID",
    responses: {
      200: {
        description: "Successfully retrieved announcement",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/AnnouncementResponse" },
          },
        },
      },
      404: {
        description: "Announcement not found",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: { type: "string" },
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
                error: {
                  type: "string",
                  default: "Error message",
                },
              },
            },
          },
        },
      },
    },
  }),
  async (c) => {
    const { id } = await c.req.param();

    const { data, error } = await config.supabaseClient
      .from("announcements")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return c.json({ error: "Announcement not found" }, 404);
      }
      throw new Error(error.message);
    }

    return c.json(data);
  }
);

export default announcement_get;
