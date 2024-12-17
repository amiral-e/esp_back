import { createClient } from '@supabase/supabase-js'
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

const document_post = new OpenAPIHono()
const supabase = createClient(process.env.DATABASE_URL || '', process.env.PUBLIC_API_KEY || '')
const bearer_token = process.env.BEARER_TOKEN || ''
const backend_ia_url = process.env.BACKEND_IA_URL || ''

const route = createRoute({
    method: 'post',
    path: '/:collection_name', 
    request: {
        params: z.object({
            collection_name: z.string(),
        }),
        body: {
            content: {
                'multipart/form-data': {
                    schema: z.object({
                        files: z.union([z.object({}), z.array(z.any())]),
                    })
                }
            }
        },
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

document_post.openapi(route, async (c) => {
    const body = await c.req.parseBody({ all: true })
    const { collection_name } = c.req.param()
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

    const files = body.files
    const formData = new FormData();
    if (Array.isArray(files)) {
        for (const file of files)
            formData.append('files', file);
    } else
        formData.append('files', files);


    const headers = new Headers();
    headers.append("Authorization", `Bearer ${bearer_token}`);
    headers.append("uid", session.data.user?.id || '');

    const response = await fetch(`${backend_ia_url}/collections/${collection_name}`, {
        method: "POST",
        body: formData,
        headers: headers,
    });

    if (!response.ok) {
        let error = await response.json()
        console.error("Fetch failed with status:", response.status);
        console.error("Fetch response:", error);
        return c.json({ error: error }, 500);
    }

    const res = await response.json()
    return c.json({ response: res.message }, 200)
}, (result, c) => {
    if (!result.success) {
        return c.json({ error: result.error.message }, 401)
    }
})

export default document_post