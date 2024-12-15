import { createClient } from '@supabase/supabase-js'
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

const delete_conversation = new OpenAPIHono()
const supabase = createClient(process.env.DATABASE_URL || '', process.env.PUBLIC_API_KEY || '')

const route = createRoute({
    method: 'delete',
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

delete_conversation.openapi(route, async (c) => {
    const { conv_id } = c.req.param()
    const { access_token, refresh_token } = c.req.header()

    const session = await supabase.auth.setSession({
        access_token,
        refresh_token,
    })

    const { data: conv, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', session.data.user?.id)
        .eq('id', conv_id)
        .single()

    if (conv == undefined || conv.length == 0)
        return c.json({ error: 'Conversation not found' }, 404)
    else if (error)
        return c.json({ error: error.message }, 500)

    const { data: deletedConv, error: deleteError } = await supabase
        .from('conversations')
        .delete()
        .eq('user_id', session.data.user?.id)
        .eq('id', conv_id)
        .select()
        .single()

    if (deletedConv == undefined && deleteError)
        return c.json({ error: deleteError.message }, 500)

    return c.json({ message: `Conversation ${conv_id} deleted successfully` }, 200)
}, (result, c) => {
    if (!result.success) {
        return c.json({ error: "Param validation error" }, 401)
    }
})

export default delete_conversation;