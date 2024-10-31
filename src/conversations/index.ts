import { OpenAPIHono } from "@hono/zod-openapi";
import send_message from "./send_message";
import get_conversation from "./get_conversation";
import update_conversation from "./update_conversation";
import delete_conversation from "./delete_conversation";

const routes_convs = new OpenAPIHono()

routes_convs.route('/', send_message)
routes_convs.route('/', get_conversation)
routes_convs.route('/', update_conversation)
routes_convs.route('/', delete_conversation)

export default routes_convs