import { Hono } from "hono";

import user_uid_get from "./user_uid_get.ts";
import user_jwt_gen from "./user_jwt_gen.ts";
import response_post from "./response_post.ts";
const admin = new Hono();

admin.route("/", user_uid_get);
admin.route("/", user_jwt_gen);
admin.route("/", response_post);

export default admin;
