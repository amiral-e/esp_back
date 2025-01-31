import { Hono } from "hono";

import response_post from "./response/response_post";
import response_put from "./response/response_put";

const forum = new Hono();

forum.route("/response", response_post);
forum.route("/response", response_put);

export default forum;