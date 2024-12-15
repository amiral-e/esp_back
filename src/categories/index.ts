import { OpenAPIHono } from "@hono/zod-openapi";
import insert_categories from "./insert_category.ts";
import delete_categories from "./delete_category.ts";
import edit_categories from "./edit_category.ts";

const categories = new OpenAPIHono()

categories.route('/', insert_categories)
categories.route('/', delete_categories)
categories.route('/', edit_categories)

export default categories