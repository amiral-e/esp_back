import { OpenAPIHono } from "@hono/zod-openapi";
import insert_categories from "./insert_category.ts";
import delete_admins from "./delete_admin.ts";

const routes_category = new OpenAPIHono()

routes_category.route('/', insert_categories)
// routes_admin.route('/', delete_admins)

export default routes_category