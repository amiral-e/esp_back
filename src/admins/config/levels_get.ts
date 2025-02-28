import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import config from "../../config.ts";
import AuthMiddleware from "../../middlewares/auth.ts";

const levels_get = new Hono();

levels_get.get(
    describeRoute({
        summary: "Get Knowledges Levels",
        description:
            "Retrieve knowledges levels from the database. Admin privileges are required.",
        tags: ["admins-config"],
        responses: {
            200: {
                description: "Success",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                levels: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            id: {
                                                type: "string",
                                                default: "123",
                                            },
                                            level: {
                                                type: "string",
                                                default: "beginner",
                                            },
                                        }
                                    }
                                },
                            },
                            required: ["levels"],
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
                                    default: "No level found",
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
        if (!user.admin)
            return c.json({ error: "Forbidden" }, 403);

        const levels = await config.supabaseClient
            .from("knowledges")
            .select("id, level");
        if (levels.data == undefined || levels.data.length == 0)
            return c.json({ error: "No level found" }, 404);
        else if (levels.error != undefined)
            return c.json({ error: levels.error.message }, 500);

        return c.json({ levels: levels.data }, 200);
    },
);

export default levels_get;
