import { createClient } from '@supabase/supabase-js'
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

const insert_category = new OpenAPIHono()
const supabase = createClient(process.env.DATABASE_URL || '', process.env.PUBLIC_API_KEY || '')

const route = createRoute({
    method: 'post',
    path: '/',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        name: z.string(),
                        description: z.string()
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
            description: 'Creates the category',
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

insert_category.openapi(route, async (c) => {
    const {name, description} = await c.req.valid('json')
    const {data, error} = await supabase.from('categories').insert({name: name, description: description}).select();
    
    if (data == undefined)
        return c.json({error: error.message}, 500)
    return c.json({res: data}, 200)
})

export default insert_category;