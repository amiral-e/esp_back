import { Hono } from "hono";

import admin_delete from "./self/admin_delete.ts";
import admin_insert from "./self/admin_insert.ts";
import admins_get from "./self/admins_get.ts";
import users_get from "./users/users_get.ts";

import collection_delete from "./collections/collection_delete.ts";
import collections_get from "./collections/collections_get.ts";

import document_delete from "./documents/document_delete.ts";
import documents_post from "./documents/documents_post.ts";
import documents_get from "./documents/documents_get.ts";

import category_delete from "./forum/categories/category_delete.ts";
import category_post from "./forum/categories/category_post.ts";
import category_put from "./forum/categories/category_put.ts";
import announcement_post from "./forum/announcements/announcement_post.ts";
import announcement_put from "./forum/announcements/announcement_put.ts";
import announcement_delete from "./forum/announcements/announcement_delete.ts";

import credits_post from "./profile/credits_post.ts";
import credits_put from "./profile/credits_put.ts";
import profile_get from "./profile/profile_get.ts";
import level_put from "./profile/level_put.ts";

import settings_get from "./config/prices_get.ts";
import setting_put from "./config/price_put.ts";
import prompts_get from "./config/prompts_get.ts"

import question_post from "./questions/question_post.ts";
import question_delete from "./questions/question_delete.ts";
import question_put from "./questions/question_put.ts";

const admin = new Hono();

admin.route("/", admin_delete);
admin.route("/", admin_insert);
admin.route("/", admins_get);

admin.route("/users", users_get);

admin.route("/collections", collection_delete);
admin.route("/collections", collections_get);

admin.route("/collections", documents_post);
admin.route("/collections", documents_get);
admin.route("/collections", document_delete);

admin.route("/forum/categories", category_post);
admin.route("/forum/categories", category_put);
admin.route("/forum/categories", category_delete);
admin.route("/forum/announcements", announcement_post);
admin.route("/forum/announcements", announcement_put);
admin.route("/forum/announcements", announcement_delete);

admin.route("/users", credits_post);
admin.route("/users", credits_put);
admin.route("/users", profile_get);
admin.route("/users", level_put);

admin.route("/config", settings_get);
admin.route("/config", setting_put);
admin.route("/config/prompts", prompts_get);

admin.route("/questions", question_post);
admin.route("/questions", question_delete);
admin.route("/questions", question_put);

export default admin;
