import { Hono } from "hono";

import categories_get from "./categories/categories_get";

import response_delete from "./response/response_delete";
import response_post from "./response/response_post";
import response_put from "./response/response_put";

import announcements_get from "./announcements/announcements_get";

import publication_post from "./publications/publication_post";
import publication_put from "./publications/publication_put";
import publication_delete from "./publications/publication_delete";

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
