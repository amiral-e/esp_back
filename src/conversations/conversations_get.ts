import { createClient } from '@supabase/supabase-js'
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

const get_conversations = new OpenAPIHono()
const supabase = createClient(process.env.DATABASE_URL || '', process.env.PUBLIC_API_KEY || '')

const route = createRoute({
    method: 'get',
    path: '/',
    tags: ['Conversations'],
    request: {
        headers: z.object({
            access_token: z.string(),
            refresh_token: z.string(),
        }),
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.object({
                        convs: z.array(z.object({})),
                    }),
                },
            },
            description: 'Get user conversations',
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

get_conversations.openapi(route, async (c) => {
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

    if (conv == undefined && error)
        return c.json({ error: error.message }, 500)
    else if (conv.length == 0)
        return c.json({ error: 'Conversation not found' }, 404)
    return c.json({ convs: conv }, 200)
}, (result, c) => {
    if (!result.success) {
        return c.json({ error: "Param validation error" }, 401)
    }
})

export default get_conversations;