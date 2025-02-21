import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import config from "../../../config";
import AuthMiddleware from "../../../middlewares/auth";

const announcement_post = new Hono();

announcement_post.post(
    describeRoute({
        summary: "Create Announcement",
        description: "Creates a new announcement in the database. Admin privileges are required.",
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
                                default: "New Announcement",
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
                                    default: "Announcement created successfully",
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

        let json: any;
        try {
            json = await c.req.json();
            if (!json || json.message == undefined)
                return c.json({ error: "Invalid JSON" }, 400);
        } catch (error) {
            return c.json({ error: "Invalid JSON" }, 400);
        }

        const { data, error } = await config.supabaseClient
            .from("announcements")
            .insert(json)
            .select("*").single();
        if (error != undefined) return c.json({ error: error.message }, 500);

        return c.json({ message: "Announcement created successfully", data: data }, 200);
    },
);

export default announcement_post;
