import { OpenAPIHono } from "@hono/zod-openapi";

import admin_delete from "./admin_delete.ts";
import admin_insert from "./admin_insert.ts";

const admin = new OpenAPIHono()

admin.route('/', admin_delete)
admin.route('/', admin_insert)

export default admin