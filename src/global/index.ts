import { Hono } from "hono";

import collection_delete from "./collection_delete";
import collections_get from "./collections_get";
import document_delete from "./document_delete";
import document_post from "./document_post";
import documents_get from "./documents_get";

const global = new Hono();

global.route('/', collection_delete);
global.route('/', collections_get);
global.route('/', document_delete);
global.route('/', document_post);
global.route('/', documents_get);

export default global;