import { createClient } from '@supabase/supabase-js'
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

const delete_collection = new OpenAPIHono()
const supabase = createClient(process.env.DATABASE_URL || '', process.env.PUBLIC_API_KEY || '')
const bearer_token = process.env.BEARER_TOKEN || ''
const backend_ia_url = process.env.BACKEND_IA_URL || ''

const route = createRoute({
    method: 'delete',
    path: '/:collection_name',
    request: {
        headers: z.object({
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
            description: 'Collection deleted',
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

delete_collection.openapi(route, async (c) => {
    const { collection_name } = c.req.param()
    const { access_token, refresh_token, uid } = c.req.header()

    const session = await supabase.auth.setSession({
        access_token,
        refresh_token,
    })

    if (!session || uid !== session.data.user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
    }

    const response = await fetch(`${backend_ia_url}/collections/${collection_name}`, {
        method: "DELETE",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bearer_token}`,
            'uid': String(session.data.user?.id),
        },
    });
    if (!response.ok) {
        return c.json({ error: 'Internal server error' }, 500)
    }

    return c.json({ response: 'Collection deleted' }, 200)
}, (result, c) => {
    if (!result.success) {
        return c.json({error: "Param validation error"}, 401)
    }
})

export default delete_collection