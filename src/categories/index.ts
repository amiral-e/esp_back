import { OpenAPIHono } from "@hono/zod-openapi";
import insert_categories from "./insert_category.ts";
import delete_categories from "./delete_category.ts";

const routes_category = new OpenAPIHono()

routes_category.route('/', insert_categories)
routes_category.route('/', delete_categories)

export default routes_category