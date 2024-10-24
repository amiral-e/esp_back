import { OpenAPIHono } from "@hono/zod-openapi";
import insert_admins from "./insert_admin.ts";
import delete_admins from "./delete_admin.ts";

const routes_admin = new OpenAPIHono()

routes_admin.route('/', insert_admins)
routes_admin.route('/', delete_admins)

export default routes_admin