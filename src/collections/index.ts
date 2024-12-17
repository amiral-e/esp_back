import { OpenAPIHono } from "@hono/zod-openapi";
import collection_delete from './collection_delete'
import collections_get from './collections_get'
import collections_global_get from './collections_global_get'

const collections = new OpenAPIHono()

collections.route('/', collection_delete)
collections.route('/', collections_get)
collections.route('/global', collections_global_get)

export default collections