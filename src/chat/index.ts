import { OpenAPIHono } from "@hono/zod-openapi";

import post_chat from "./chat_post";
import post_chat_collection from "./chat_collection_post";

const chat = new OpenAPIHono()

chat.route('/', post_chat)
chat.route('/', post_chat_collection)

export default chat