import { Hono } from "hono";

import conversation_post from "./conversation_post";
import conversation_get from "./conversation_get";
import conversation_update from "./conversation_update";
import conversation_delete from "./conversation_delete";
import conversations_get from "./conversations_get";

const conversations = new Hono();

conversations.route('/', conversation_post);
conversations.route('/', conversation_get);
conversations.route('/', conversation_update);
conversations.route('/', conversation_delete);
conversations.route('/', conversations_get);

export default conversations;