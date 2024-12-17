import { OpenAPIHono } from "@hono/zod-openapi";
import collection_delete from './collection_delete'

const collections = new OpenAPIHono()

collections.route('/', collection_delete)

export default collections