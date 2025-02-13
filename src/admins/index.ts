import { Hono } from "hono";

import admin_delete from "./admin_delete.ts";
import admin_insert from "./admin_insert.ts";

import collection_delete from "./collections/collection_delete.ts";
import collections_get from "./collections/collections_get.ts";
import document_delete from "./documents/document_delete.ts";
import documents_post from "./documents/documents_post.ts";
import documents_get from "./documents/documents_get.ts";

const admin = new Hono();

admin.route("/", admin_delete);
admin.route("/", admin_insert);

admin.route("/collections/", collection_delete);
admin.route("/collections/", collections_get);
admin.route("/collections/:collection_name/documents/", documents_post);
admin.route("/collections/:collection_name/documents/", documents_get);
admin.route("/collections/:collection_name/documents/", document_delete);

export default admin;
