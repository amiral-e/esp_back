import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import AuthMiddleware from "../middlewares/middleware_auth.ts";

const response_post = new Hono();

response_post.post('/:id',
    describeRoute({
        summary: 'Create a response',
        description: 'Creates a response in forum discusion',
        tags: ['responses'],
        parameters: [
            {
                name: 'id',
                in: 'path',
                required: true,
                schema: {
                    type: 'string',
                },
                description: 'ID of the response',
            }
        ],
        requestBody: {
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            user_id: {
                                type: 'string',
                                description: 'User ID',
                            },
                            message: {
                                type: 'string',
                                description: 'The response message',
                            },
                        },
                        required: ['user_id','message'],
                    },
                },
            },
            required: true,
        },
        responses: {
            200: {
                description: 'Response created successfully',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                id: {
                                    type: 'string',
                                    description: 'Response ID',
                                },
                                message: {
                                    type: 'string',
                                    description: 'Response message',
                                },
                                user_id: {
                                    type: 'string',
                                    description: 'User ID who created the response',
                                },
                                created_at: {
                                    type: 'string',
                                    format: 'date-time',
                                    description: 'Response creation timestamp',
                                },
                            },
                        },
                    },
                },
            },
            400: {
                description: 'Invalid request',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                error: {
                                    type: 'string',
                                    description: 'Error message',
                                },
                            },
                        },
                    },
                },
            },
            500: {
                description: 'Server error',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                error: {
                                    type: 'string',
                                    description: 'Error message',
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
        const post_id = c.req.param('id');
        const user = c.get('user');
        
        let json: any;
        try {
            json = await c.req.json();
            if (!json || !json.message) {
                return c.json({ error: "Invalid JSON: message is required" }, 400);
            }
        } catch (error) {
            return c.json({ error: "Invalid JSON" }, 400);
        }

        try {
            const response = await c.get('supabaseClient')
                .from('responses')
                .insert({
                    post_id: post_id,
                    user_id: user.uid,
                    message: json.message
                })
                .select()
                .single();

            if (response.error) {
                throw response.error;
            }

            return c.json(response.data);
        } catch (error: any) {
            return c.json({ error: error.message }, 500);
        }
    });

export default response_post;
