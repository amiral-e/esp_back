import { Hono } from "hono";

import categories_get from "./categories_get.ts";

const categories = new Hono();

categories.route("/", categories_get);

export default categories;
