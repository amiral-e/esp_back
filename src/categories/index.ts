import { Hono } from "hono";

import category_post from "./category_post.ts";
import category_delete from "./category_delete.ts";
import category_put from "./category_put.ts";
import categories_get from "./categories_get.ts";

const categories = new Hono();

categories.route('/', category_post)
categories.route("/", category_delete);
categories.route('/', category_put)
categories.route('/', categories_get)

export default categories;
