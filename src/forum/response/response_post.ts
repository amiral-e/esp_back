import config from "../../config.ts";
import AuthMiddleware from "../../middlewares/middleware_auth.ts";
import { Hono } from "hono";

const response_post = new Hono();

response_post.post("/", AuthMiddleware, async (c: any) => {
    const user = c.get("user");

    try {
        const { message } = await c.req.json();
        
        if (!message) {
            return c.json({ error: "Message is required" }, 400);
        }

        const { data, error } = await config.supabaseClient
            .from("responses")
            .insert({
                message: message,
                user_id: user.uid
            })
            .select()
            .single();
        if (data == undefined || error != undefined) {
            return c.json({ error: error.message }, 500);
        }

        return c.json(
            {
                message: `Response of ${user.uuid} created successfully with id ${data.id}`,
            },
            200
        );
    } catch (error) {
        // Handle JSON parsing errors
        return c.json({ error: "Invalid JSON body" }, 400);
    }
});

export default response_post;
