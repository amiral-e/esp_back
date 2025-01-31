import config from "../../config.ts";
import AuthMiddleware from "../../middlewares/middleware_auth.ts";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { isAdmin } from "../../admins/utils.ts";

const response_delete = new Hono();
response_delete.delete("/:id",
    describeRoute({
        summary: 'Delete a response',
        description: 'Delete a response by ID. Users can delete their own responses. Administrators can delete any response.',
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
        responses: {
            200: {
                description: 'OK',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                message: {
                                    type: 'string',
                                    default: 'Response deleted successfully',
                                    description: 'Success message'
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
                                    default: 'Not authorized to delete this response',
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

        const { data: existingResponse, error: fetchError } = await config.supabaseClient
            .from("responses")
            .select("*")
            .eq('id', id)
            .single();

        if (fetchError || !existingResponse) {
            return c.json({ error: "Response not found" }, 404);
        }

        const isUserAdmin = await isAdmin(user.uid);
        if (existingResponse.user_id !== user.uid && !isUserAdmin) {
            return c.json({ error: "Not authorized to delete this response" }, 403);
        }

        const { error } = await config.supabaseClient
            .from("responses")
            .delete()
            .eq('id', id);

        if (error) {
            return c.json({ error: error.message }, 500);
        }

        return c.json({ message: "Response deleted successfully" }, 200);
    }
);

export default response_delete;