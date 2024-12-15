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

const collections = new OpenAPIHono()

collections.route('/global', delete_admin_collection)
collections.route('/global', delete_admin_document)
collections.route('/', delete_collection)
collections.route('/', delete_document)
collections.route('/', get_collections)
collections.route('/', get_documents)
collections.route('/global', get_global_collections)
collections.route('/global', get_global_documents)
collections.route('/global', post_admin_collection)
collections.route('/', post_collection)

export default collections