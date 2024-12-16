import { createClient } from '@supabase/supabase-js'
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

const post_chat = new OpenAPIHono()
const supabase = createClient(process.env.DATABASE_URL || '', process.env.PUBLIC_API_KEY || '')

const route = createRoute({
    method: 'post',
    path: '/{conv_id}',
    tags: ['Chat'],
    request: {
        params: z.object({
            conv_id: z.string(),
        }),
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                    }),
                }
            }
        },
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
                        role: z.string(),
                        content: z.string(),
                    }),
                },
            },
            description: 'Send the message',
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

post_chat.openapi(route, async (c) => {
    const { message } = c.req.valid('json');
    const { conv_id } = c.req.param();
    const { access_token, refresh_token } = c.req.header();

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
        .single();

    if (conv == undefined || conv.length == 0)
        return c.json({ error: 'Conversation not found' }, 404);
    else if (error)
        return c.json({ error: error.message }, 500);

    var history = conv.history;
    history.push({ role: "user", content: message });

    const response = await fetch(`${process.env.BACKEND_IA_URL}/chat`, {
        method: "POST",
        body: JSON.stringify(history),
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.BEARER_TOKEN}`,
        },
    });

    if (!response.ok) {
        console.error("Fetch failed with status:", response.status);
        console.error("Fetch response:", await response.text());
        return c.json({ error: "Error from ai service" }, 500);
    }

    const body = await response.json();
    history.push({ role: "assistant", content: body.content });

    const { data, error: err } = await supabase
        .from('conversations')
        .update({ history: history })
        .eq('id', conv.id)
        .single();

    if (data == undefined && err) {
        return c.json({ error: err.message }, 500);
    }

    return c.json({ role: "assistant", content: body.content }, 200);
}, (result, c) => {
    if (!result.success) {
        return c.json({ error: "Param validation error" }, 401);
    }
});


export default post_chat;        