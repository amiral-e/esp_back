import { createClient } from '@supabase/supabase-js'
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

const post_global_collection = new OpenAPIHono()
const supabase = createClient(process.env.DATABASE_URL || '', process.env.PUBLIC_API_KEY || '')
const bearer_token = process.env.BEARER_TOKEN || ''
const backend_ia_url = process.env.BACKEND_IA_URL || ''

const route = createRoute({
    method: 'post',
    path: '/:collection_name',
    request: {
        body: {
            content: {
                'multipart/form-data': {
                    schema: z.object({
                        files: z.array(z.instanceof(File))
                    })
                }
            }
        },
        headers: z.object({
            'content-type': z.string(),
            access_token: z.string(),
            refresh_token: z.string(),
            uid: z.string(),
        }),
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.object({
                        response: z.string(),
                    }),
                },
            },
            description: 'Collection uploaded',
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

post_global_collection.openapi(route, async (c) => {
    const body = await c.req.parseBody({ all: true })
    const files = body.files
    const { collection_name } = c.req.param()
    const {access_token, refresh_token, uid} = c.req.header()

    const session = await supabase.auth.setSession({
        access_token,
        refresh_token,
    })

    if (!session || uid !== session.data.user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
    }

    const {data, error} = await supabase.from('admins').select('*').eq('user_id', session.data.user?.id).single()
    if (error || !data) {
        return c.json({ error: 'Unauthorized' }, 401)
    }

    const formData = new FormData();
    for (const file of Array.from(files)) {
        formData.append('files', file);
    }

    const headers = new Headers();
    headers.append("Authorization", `Bearer ${bearer_token}`);
    headers.append("uid", 'global');
    const response = await fetch(`${backend_ia_url}/collections/${collection_name}`, {
        method: "POST",
        body: formData,
        headers: headers,
    });

    if (!response.ok) {
        return c.json({ error: 'Internal server error' }, 500)
    }

    return c.json({ response: 'Collection uploaded' }, 200)
}, (result, c) => {
    if (!result.success) {
        return c.json({error: "Param validation error"}, 401)
    }
})

export default post_global_collection