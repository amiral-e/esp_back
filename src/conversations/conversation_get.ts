import { createClient } from '@supabase/supabase-js'
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

const get_conversation = new OpenAPIHono()
const supabase = createClient(process.env.DATABASE_URL || '', process.env.PUBLIC_API_KEY || '')

const route = createRoute({
    method: 'get',
    path: '/{conv_id}',
    tags: ['Conversations'],
    request: {
        headers: z.object({
            access_token: z.string(),
            refresh_token: z.string(),
        }),
        params: z.object({
            conv_id: z.string(),
        }),
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.object({
                        name: z.string({}),
                        history: z.array(z.object({})),
                        id: z.string(),
                    }),
                },
            },
            description: 'Get the conversation',
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

get_conversation.openapi(route, async (c) => {
    const { conv_id } = c.req.param()
    const { access_token, refresh_token } = c.req.header()

    let session
    try {
        session = await supabase.auth.setSession({
            access_token,
            refresh_token
        })
    } catch (_) {
        return c.json({ error: "Invalid credentials" }, 401)
    }

    const { data: conv, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', session.data.user?.id)
        .eq('id', conv_id)
        .single()

    if (conv == undefined || conv.length == 0)
        return c.json({ error: "Conversation not found" }, 404)
    else if (error)
        return c.json({ error: error.message }, 500)

    return c.json({ name: conv.name, history: conv.history, id: conv.id }, 200)
}, (result, c) => {
    if (!result.success) {
        return c.json({ error: "Param validation error" }, 401)
    }
})

export default get_conversation;