import { createClient } from '@supabase/supabase-js'
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

const edit_categories = new OpenAPIHono()
const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_KEY || '')

const route = createRoute({
    method: 'put',
    path: '/{id}',
    request: {
        params: z.object({ id: z.string() }),
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
            description: 'Deletes the category',
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

        404: {
            content: {
                'application/json': {
                    schema: z.object({
                        error: z.string(),
                    }),
                },
            },
            description: 'Resource not found',
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

edit_categories.openapi(route, async (c) => {
    const { id } = await c.req.valid('param')
    const body = await c.req.json()

    const {data, error} = await supabase.from('categories').update(body).eq('id', id).select();
    if (data == undefined)
        return c.json({error: error.message}, 500)
    else if (data.length == 0)
        return c.json({error: `Category with ID ${id} not found` }, 404)
    return c.json({res: data}, 200)
})

export default edit_categories;