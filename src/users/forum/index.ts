import { Hono } from "hono";

import categories_get from "./categories/categories_get";

import response_delete from "./response/response_delete";
import response_post from "./response/response_post";
import response_put from "./response/response_put";

import announcements_get from "./announcements/announcements_get";

const forum = new Hono();

forum.route("/categories", categories_get);

forum.route("/responses", response_post);
forum.route("/responses/", response_put);
forum.route("/responses/", response_delete);

forum.route("/announcements/", announcements_get);

export default forum;
