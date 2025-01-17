import chat_post from "./chat_post";
import chat_collection_post from "./chat_collection_post";
import { Hono } from "hono";

const chat = new Hono();

chat.route("/", chat_post);
chat.route("/", chat_collection_post);

export default chat;
