import { createClient } from '@supabase/supabase-js'
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

const update_conversation = new OpenAPIHono()
const supabase = createClient(process.env.DATABASE_URL || '', process.env.PUBLIC_API_KEY || '')

const route = createRoute({
    method: 'patch',
    path: '/{conv_id}',
    tags: ['Conversations'],
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        name: z.string(),
                    }),
                }
            }
        },
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
                        message: z.object({}),
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

update_conversation.openapi(route, async (c) => {
    const { name } = c.req.valid('json')
    const { conv_id } = c.req.param()
    const { access_token, refresh_token } = c.req.header()

    const session = await supabase.auth.setSession({
        access_token,
        refresh_token,
    })

    const { data: conv, error } = await supabase
        .from('conversations')
        .update({ name: name })
        .eq('user_id', session.data.user?.id)
        .eq('id', conv_id)
        .select('*')
        .single()

    if (conv == undefined || conv.length == 0)
        return c.json({ error: "Conversation not found" }, 404)
    else if (error)
        return c.json({ error: error.message }, 500)

    return c.json({ message: `Conversation ${conv.id}'s name updated from ${conv.name} to ${name}` }, 200)
}, (result, c) => {
    if (!result.success) {
        return c.json({ error: "Param validation error" }, 401)
    }
})

export default update_conversation;