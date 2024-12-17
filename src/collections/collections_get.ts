import { createClient } from '@supabase/supabase-js'
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

const get_collections = new OpenAPIHono()
const supabase = createClient(process.env.DATABASE_URL || '', process.env.PUBLIC_API_KEY || '')
const bearer_token = process.env.BEARER_TOKEN || ''
const backend_ia_url = process.env.BACKEND_IA_URL || ''

const route = createRoute({
    method: 'get',
    path: '/',
    request: {
        headers: z.object({
            access_token: z.string().min(1),
            refresh_token: z.string().min(1),
        }),
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.object({
                        response: z.object({}),
                    }),
                },
            },
            description: 'Collection retrieved',
        },
        500: {
            content: {
                'application/json': {
                    schema: z.object({
                        error: z.any(),
                    }),
                },
            },
            description: 'Internal server error',
        },
        401: {
            content: {
                'application/json': {
                    schema: z.object({
                        error: z.any(),
                    }),
                },
            },
            description: 'Validation error',
        },
    },
})

get_collections.openapi(route, async (c) => {
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

    
    const headers = new Headers();
    headers.append("Authorization", `Bearer ${bearer_token}`);
    headers.append("uid", session.data.user?.id || '');

    const response = await fetch(`${backend_ia_url}/collections`, {
        method: "GET",
        headers: headers,
    });
    if (!response.ok) {
        let error = await response.json()
        console.error("Fetch failed with status:", response.status);
        console.error("Fetch response:", error);
        return c.json({ error: error }, 500);
    }

    const res = await response.json()
    return c.json({ response: res.collections }, 200)
}, (result, c) => {
    if (!result.success) {
        return c.json({error: "Param validation error"}, 401)
    }
})

export default get_collections