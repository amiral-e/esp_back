import { Hono } from "hono";

import response_post from "./response/response_post";

const forum = new Hono();

forum.route("/", response_post);

export default forum;