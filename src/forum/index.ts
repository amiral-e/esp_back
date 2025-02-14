import { Hono } from "hono";

import response_post from "./response/response_post";
import response_put from "./response/response_put";
import response_delete from "./response/response_delete";

const forum = new Hono();

forum.route("/response", response_post);
forum.route("/response", response_put);
forum.route("/response", response_delete);

export default forum;