import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../../config.ts";
import AuthMiddleware from "../../../middlewares/auth.ts";

const announcement_put = new Hono();

announcement_put.put(
    "/:id",
    describeRoute({
        summary: "Update Announcement",
        description: "Updates a specific announcement in the database. Admin privileges are required.",
        tags: ["admins-announcements"],
        requestBody: {
            required: true,
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            message: {
                                type: "string",
                                description: "The message of the announcement",
                                default: "Updated Announcement",
                            }
                        },
                        required: ["message"],
                    },
                },
            },
        },
        responses: {
            200: {
                description: "Success",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                message: {
                                    type: "string",
                                    default: "Announcement updated successfully",
                                },
                            },
                            required: ["message"],
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
                                error: {
                                    type: "string",
                                    default: "Invalid JSON",
                                },
                            },
                            required: ["error"],
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
                                error: {
                                    type: "string",
                                    default: [
                                        "No authorization header found",
                                        "Invalid authorization header",
                                        "Invalid user",
                                    ],
                                },
                            },
                            required: ["error"],
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
                                    default: "Forbidden",
                                },
                            },
                        },
                    },
                },
            },
            404: {
                description: "Not found",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                error: {
                                    type: "string",
                                    default: "Announcement not found",
                                },
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
    AuthMiddleware,
    async (c: any) => {
        const user = c.get("user");
        if (!user.admin) return c.json({ error: "Forbidden" }, 403);

        const { id } = await c.req.param();

        let json: any;
        try {
            json = await c.req.json();
            if (!json || json.message == undefined)
                return c.json({ error: "Invalid JSON" }, 400);
        } catch (error) {
            return c.json({ error: "Invalid JSON" }, 400);
        }

        const announcement = await config.supabaseClient
            .from("announcements")
            .select("*")
            .eq("id", id)
            .single();
        if (announcement.data == undefined || announcement.data.length == 0)
            return c.json({ error: "Announcement not found" }, 404);
        else if (announcement.error != undefined)
            return c.json({ error: announcement.error.message }, 500);

        const data = await config.supabaseClient
            .from("announcements")
            .update(json)
            .eq("id", id).select("*").single();
        if (data.error != undefined)
            return c.json({ error: data.error.message }, 500);

        return c.json({ message: "Announcement updated successfully", data: data }, 200);
    },
);

export default announcement_put;
