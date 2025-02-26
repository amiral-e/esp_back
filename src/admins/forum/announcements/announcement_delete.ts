import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../../config.ts";
import AuthMiddleware from "../../../middlewares/auth.ts";

const announcement_delete = new Hono();

announcement_delete.delete(
    "/:id",
    describeRoute({
        summary: "Delete Announcement",
        description: "Deletes a specific announcement from the database. Admin privileges are required.",
        tags: ["admins-announcements"],
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
                                    default: "Announcement deleted successfully",
                                },
                            },
                            required: ["message"],
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

        const { data: announcementData, error: announcementError } = await config.supabaseClient
            .from("announcements")
            .select("*")
            .eq("id", id)
            .single();
        if (announcementData == undefined || announcementData.length == 0)
            return c.json({ error: "Announcement not found" }, 404);
        if (announcementError != undefined)
            return c.json({ error: announcementError.message }, 500);

        const { data: delData, error: delError } = await config.supabaseClient
            .from("announcements")
            .delete()
            .eq("id", id)
            .select("*");
        if (delError != undefined) return c.json({ error: delError.message }, 500);

        return c.json({ message: "Announcement deleted successfully" }, 200);
    },
);

export default announcement_delete;
