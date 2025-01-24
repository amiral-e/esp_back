import config from "../../config.ts";
import AuthMiddleware from "../../middlewares/middleware_auth.ts";
import { Hono } from "hono";

const response_post = new Hono();

response_post.post("/:id", AuthMiddleware, async (c: any) => {
    const user = c.get("user");
    const { id } = c.req.param();
    const { message } = await c.req.json();

    const { data, error } = await config.supabaseClient
        .from("responses")
        .insert({ 
            id,
            message,
            user_id: user.uid 
        })
        .select()
        .single();

    if (data == undefined || error != undefined)
        return c.json({ error: error.message }, 500);
        
    return c.json(data, 200);
});

export default response_post;