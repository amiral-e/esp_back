import { OpenAPIHono } from "@hono/zod-openapi";
import post_collection from './post_collection'

const routes_collecs = new OpenAPIHono()

routes_collecs.route('/', post_collection)

export default routes_collecs