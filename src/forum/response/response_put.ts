import config from "../../config.ts";
import AuthMiddleware from "../../middlewares/middleware_auth.ts";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

const response_put = new Hono();

response_put.put("/:id",
    describeRoute({
        summary: 'Update a response',
        description: 'Update a response by ID. Users can update their own responses. Administrators can update any response.',
        tags: ['responses'],
        parameters: [{
            name: 'id',
            in: 'path',
            description: 'Response ID',
            required: true,
            schema: {
                type: 'string'
            }
        }],
        requestBody: {
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            message: {
                                type: 'string',
                                description: 'The response message'
                            }
                        },
                        required: ['message']
                    }
                }
            },
            required: true
        },
        responses: {
            200: {
                description: 'OK',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                id: {
                                    type: 'number',
                                    description: 'The response ID'
                                },
                                message: {
                                    type: 'string',
                                    description: 'The updated message'
                                },
                                user_id: {
                                    type: 'string',
                                    description: 'The user ID'
                                }
                            }
                        }
                    }
                }
            },
            403: {
                description: 'Forbidden',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                error: {
                                    type: 'string',
                                    default: 'Not authorized to update this response',
                                    description: 'The error message'
                                }
                            }
                        }
                    }
                }
            }
        }
    }),
    AuthMiddleware,
    async (c: any) => {
        const user = c.get("user");
        const id = c.req.param('id');
        let body: any;

        try {
            body = await c.req.json();
            if (!body?.message?.trim()) {
                return c.json({ error: "Message is required" }, 400);
            }
        } catch (error) {
            return c.json({ error: "Invalid JSON body" }, 400);
        }

        const { data: existingResponse, error: fetchError } = await config.supabaseClient
            .from("responses")
            .select("*")
            .eq('id', id)
            .single();

        if (fetchError || !existingResponse) {
            return c.json({ error: "Response not found" }, 404);
        }

        if (existingResponse.user_id !== user.uid) {
            return c.json({ error: "Not authorized to update this response" }, 403);
        }

        const { data, error } = await config.supabaseClient
            .from("responses")
            .update({ message: body.message })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return c.json({ error: error.message }, 500);
        }

        return c.json(data, 200);
    }
);

export default response_put;