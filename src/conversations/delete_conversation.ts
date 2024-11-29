import { createClient } from '@supabase/supabase-js'
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

const delete_conversation = new OpenAPIHono()
const supabase = createClient(process.env.DATABASE_URL || '', process.env.PUBLIC_API_KEY || '')

const route = createRoute({
    method: 'delete',
    path: '/',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        conv_id: z.string(),
                    }),
                }
            }
        },
        headers: z.object({
            'content-type': z.string(),
            access_token: z.string(),
            refresh_token: z.string(),
        }),
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.object({}),
                        id: z.string(),
                    }),
                },
            },
            description: 'Updated conversation name',
        },
        500: {
            content: {
                'application/json': {
                    schema: z.object({
                        error: z.string(),
                    }),
                },
            },
            description: 'Internal server error',
        },
        401: {
            content: {
                'application/json': {
                    schema: z.object({
                        error: z.string(),
                    }),
                },
            },
            description: 'Validation error',
        },
        404: {
            content: {
                'application/json': {
                    schema: z.object({
                        error: z.string(),
                    }),
                },
            },
            description: 'Conversation not found',
        },
    },
})

delete_conversation.openapi(route, async (c) => {
    const {conv_id} = c.req.valid('json')
    const {access_token, refresh_token} = c.req.header()

    const session = await supabase.auth.setSession({
        access_token,
        refresh_token,
    })

    const {data: conv, error} = await supabase
        .from('conversations')
        .delete()
        .eq('id', conv_id)
        .select()
        .single()

    if (conv == undefined && error)
        return c.json({error: error.message}, 500)
    else if (conv.length == 0)
        return c.json({error: 'Conversation not found'}, 404)
    return c.json({message: "Conversation deleted", id: conv_id}, 200)
}, (result, c) => {
    if (!result.success) {
        return c.json({error: "Param validation error"}, 401)
    }
})

export default delete_conversation;