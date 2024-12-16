import { createClient } from '@supabase/supabase-js'
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

const insert_admins = new OpenAPIHono()
const supabase = createClient(process.env.DATABASE_URL || '', process.env.PUBLIC_API_KEY || '')

const route = createRoute({
    method: 'post',
    path: '/',
    tags: ['Admins'],
    request: {
        headers: z.object({
            access_token: z.string().min(1),
            refresh_token: z.string().min(1),
        }),
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        user_id: z.string().min(1),
                    }),
                }
            }
        }
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
            description: 'Retrieve the user',
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

insert_admins.openapi(route, async (c) => {
    const { user_id } = c.req.valid('json')
    const { access_token, refresh_token } = c.req.header()

    try {
        const session = await supabase.auth.setSession({
            access_token,
            refresh_token
        })
        if (session != undefined && session.data.user?.id == user_id)
            return c.json({ error: "You can't add yourself as admin" }, 401)
    } catch (_) {
        return c.json({ error: "Invalid credentials" }, 401)
    }
    const { data, error } = await supabase.from('admins').select('*');
    if (data == undefined || error != undefined || data.length == 0)
        return c.json({ error: "You don't have admin privileges" }, 401)
    else {
        if (data.find(x => x.user_id == user_id) != undefined)
            return c.json({ error: "User is already an admin" }, 401)
        else {
            const { data, error } = await supabase.from('admins').insert({ user_id: user_id }).select('*');
            if (error != undefined)
                return c.json({ error: error.message }, 500)
            else if (data == undefined || data.length == 0)
                return c.json({ error: "User doesn't exist in database" }, 401)
            return c.json({ "message": `User ${user_id} added to admins` }, 200)
        }
    }
}, (result, c) => {
    if (!result.success) {
        return c.json({ error: "Param validation error" }, 401)
    }
})

export default insert_admins;