import { Hono } from "hono";
4;
import categories_get from "./categories/categories_get";

import response_delete from "./response/response_delete";
import response_post from "./response/response_post";
import response_put from "./response/response_put";

const forum = new Hono();

forum.route("/categories", categories_get);

forum.route("/responses", response_post);
forum.route("/responses/", response_put);
forum.route("/responses/", response_delete);

export default forum;
