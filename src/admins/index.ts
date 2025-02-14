import { Hono } from "hono";

import admin_delete from "./self/admin_delete.ts";
import admin_insert from "./self/admin_insert.ts";

import collection_delete from "./collections/collection_delete.ts";
import collections_get from "./collections/collections_get.ts";

import document_delete from "./documents/document_delete.ts";
import documents_post from "./documents/documents_post.ts";
import documents_get from "./documents/documents_get.ts";

import category_delete from "./forum/categories/category_delete.ts";
import category_post from "./forum/categories/category_post.ts";
import category_put from "./forum/categories/category_put.ts";

const admin = new Hono();

admin.route("/", admin_delete);
admin.route("/", admin_insert);

admin.route("/collections", collection_delete);
admin.route("/collections", collections_get);

admin.route("/collections/:collection_name/documents", documents_post);
admin.route("/collections/:collection_name/documents", documents_get);
admin.route("/collections/:collection_name/documents", document_delete);

admin.route("/forum/categories", category_post);
admin.route("/forum/categories", category_put);
admin.route("/forum/categories", category_delete);

export default admin;
