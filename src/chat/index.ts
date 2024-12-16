import { OpenAPIHono } from "@hono/zod-openapi";
import post_chat from "./post_chat";
import post_chat_collection from "./post_chat_collection";

const chat = new OpenAPIHono()

chat.route('/', post_chat)
chat.route('/', post_chat_collection)

export default chat