import { createClient } from '@supabase/supabase-js'
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

const delete_admins = new OpenAPIHono()
const supabase = createClient(process.env.DATABASE_URL || '', process.env.PUBLIC_API_KEY || '')

const route = createRoute({
    method: 'delete',
    path: '/',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        access_token: z.string(),
                        refresh_token: z.string(),
                        user_id: z.string(),
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
                        res: z.object({}),
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

delete_admins.openapi(route, async (c) => {
    const {access_token, refresh_token, user_id} = c.req.valid('json')

    const session = await supabase.auth.setSession({
        access_token,
        refresh_token
    })
    const {data, error} = await supabase.from('admins').delete().eq('user_id', user_id).select('*');
    
    if (data == undefined)
        return c.json({error: error.message}, 500)
    else if (data.length == 0)
        return c.json({error: "User not Admin"}, 401)
    return c.json({res: data}, 200)
}, (result, c) => {
    if (!result.success) {
        return c.json({error: "Param validation error"}, 401)
    }
})

export default delete_admins;