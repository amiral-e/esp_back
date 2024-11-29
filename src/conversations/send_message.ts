import { createClient } from '@supabase/supabase-js'
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

const send_message = new OpenAPIHono()
const supabase = createClient(process.env.DATABASE_URL || '', process.env.PUBLIC_API_KEY || '')

const route = createRoute({
    method: 'post',
    path: '/',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        conv_id: z.string(),
                        message: z.string(),
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
                        response: z.object({}),
                        id: z.string(),
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

send_message.openapi(route, async (c) => {
    const {conv_id, message} = c.req.valid('json')
    const {access_token, refresh_token} = c.req.header()

    const session = await supabase.auth.setSession({
        access_token,
        refresh_token,
    })

    const {conv, error} = await (async () => {
        if (Number(conv_id) == 0) {
            const {data: conv, error} = await supabase
                .from('conversations')
                .insert({history: [], name: 'New conversation', user_id: session.data.user?.id}).select('*').single()
            return {conv, error}
        } else {
            const {data: conv, error} = await supabase
                .from('conversations')
                .select('*')
                .eq('id', conv_id)
                .single()
            return {conv, error}
        }
    })();

    if (conv == undefined && error)
        return c.json({error: error.message}, 500)
    else if (conv.length == 0)
        return c.json({error: 'Conversation not found'}, 404)
    var history = conv.history
    history.push({role: "user", content: message})

    const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        body: JSON.stringify(history),
        headers: { 
            "Content-Type": "application/json",
            "bearer-token": 'beuteu'
        },
    });
    
    const body = await response.json();
    history.push({role: "assistant", content: body.content})
    const {data, error: err} = await supabase.from('conversations').update({history: history}).eq('id', conv.id).single()

    if (data == undefined && err)
        return c.json({error: err.message}, 500)
    return c.json({response: body.content, id: conv.id}, 200)
}, (result, c) => {
    if (!result.success) {
        return c.json({error: "Param validation error"}, 401)
    }
})

export default send_message;