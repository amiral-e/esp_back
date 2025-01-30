import { Hono } from "hono";

import response_post from "./response/response_post";

const responses = new Hono();

responses.route("/", response_post);

export default responses;