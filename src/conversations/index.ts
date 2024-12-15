import { OpenAPIHono } from "@hono/zod-openapi";

import post_conversation from "./conversation_post";
import get_conversation from "./conversation_get";
import update_conversation from "./conversation_update";
import delete_conversation from "./conversation_delete";
import get_conversations from "./conversations_get";

const conversations = new OpenAPIHono()

conversations.route('/', post_conversation)
conversations.route('/', get_conversation)
conversations.route('/', get_conversations)
conversations.route('/', update_conversation)
conversations.route('/', delete_conversation)

export default conversations