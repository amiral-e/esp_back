import config from '../config.ts';
import AuthMiddleware from "../auth_middleware.ts";
import { Hono } from "hono";

const conversation_get = new Hono();

conversation_get.get('/:conv_id', AuthMiddleware, async (c: any) => {
    const user = c.get('user');
    const { conv_id } = c.req.param();

    const { data, error } = await config.supabaseClient.from('conversations').select('*').eq('user_id', user.uid).eq('id', conv_id).single();
    if (data == undefined || data.length == 0)
        return c.json({ error: "Conversation not found" }, 404);
    else if (error != undefined)
        return c.json({ error: error.message }, 500);
    return c.json({ name: data.name, history: data.history, id: data.id }, 200);
})

export default conversation_get;