import { Hono } from "hono";

import categories_get from "./categories/categories_get_def";

import response_delete from "./response/response_delete_def";
import response_post from "./response/response_post_def";
import response_put from "./response/response_put_def";

import announcements_get from "./announcements/announcements_get_def";

import publication_post from "./publications/publication_post_def";
import publication_put from "./publications/publication_put_def";
import publication_delete from "./publications/publication_delete_def";

const forum = new Hono();

forum.route("/categories", categories_get);

forum.route("/responses", response_post);
forum.route("/responses/", response_put);
forum.route("/responses/", response_delete);

forum.route("/announcements/", announcements_get);

forum.route("/publications", publication_post);
forum.route("/publications", publication_put);
forum.route("/publications", publication_delete);

export default forum;
