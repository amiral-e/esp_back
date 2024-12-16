import { createClient } from '@supabase/supabase-js'
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

const post_conversation = new OpenAPIHono()
const supabase = createClient(process.env.DATABASE_URL || '', process.env.PUBLIC_API_KEY || '')

const route = createRoute({
    method: 'post',
    path: '/:conv_name',
    tags: ['Conversations'],
    request: {
        headers: z.object({
            access_token: z.string().min(1),
            refresh_token: z.string().min(1),
        }),
        params: z.object({
            conv_name: z.string({}),
        }),
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                    }),
                },
            },
            description: 'Conversation created successfully',
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
    },
})

post_conversation.openapi(route, async (c) => {
    const { conv_name } = c.req.param();
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
        .insert({ history: [], name: conv_name, user_id: session.data.user?.id })
        .select('*')
        .single();

    if (conv == undefined && error)
        return c.json({ error: error.message }, 500);

    return c.json({ message: `Conversation ${conv_name} created successfully with id ${conv.id}` }, 200);
}, (result, c) => {
    if (!result.success) {
        return c.json({ error: "Param validation error" }, 401)
    }
})

export default post_conversation;