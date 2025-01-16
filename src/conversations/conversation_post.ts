import config from '../config.ts';
import AuthMiddleware from "../auth_middleware.ts";
import { Hono } from 'hono';

const conversation_post = new Hono();

conversation_post.post('/:conv_name', AuthMiddleware, async (c: any) => {
    const user = c.get('user');
    const { conv_name } = c.req.param();

    const { data, error } = await config.supabaseClient.from('conversations').insert({ history: [], name: conv_name, user_id: user.uid }).select('*').single();
    if (data == undefined || error != undefined)
        return c.json({ error: error.message }, 500);
    return c.json({ message: `Conversation ${conv_name} created successfully with id ${data.id}` }, 200);
})

export default conversation_post;