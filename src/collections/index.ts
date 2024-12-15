import { OpenAPIHono } from "@hono/zod-openapi";
import delete_admin_collection from './delete_admin_collection'
import delete_admin_document from './delete_admin_document'
import delete_collection from './delete_collection'
import delete_document from "./delete_document";
import get_collections from "./get_collections";
import get_documents from "./get_documents";
import get_global_collections from "./get_global_collections";
import get_global_documents from "./get_global_documents";
import post_admin_collection from "./post_admin_collection";
import post_collection from './post_collection'

const routes_collecs = new OpenAPIHono()

routes_collecs.route('/global', delete_admin_collection)
routes_collecs.route('/global', delete_admin_document)
routes_collecs.route('/', delete_collection)
routes_collecs.route('/', delete_document)
routes_collecs.route('/', get_collections)
routes_collecs.route('/', get_documents)
routes_collecs.route('/global', get_global_collections)
routes_collecs.route('/global', get_global_documents)
routes_collecs.route('/global', post_admin_collection)
routes_collecs.route('/', post_collection)

export default routes_collecs