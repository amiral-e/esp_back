import send_message from "./send_message";
import { OpenAPIHono } from "@hono/zod-openapi";

const routes_convs = new OpenAPIHono()

routes_convs.route('/', send_message)

export default routes_convs