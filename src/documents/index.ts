import { OpenAPIHono } from "@hono/zod-openapi";

import document_post from './document_post'
import document_delete from "./document_delete";

const collections = new OpenAPIHono()

collections.route('/', document_post)
collections.route('/', document_delete)

export default collections