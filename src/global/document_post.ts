import config from '../config.ts';
import AuthMiddleware from "../auth_middleware.ts";
import { Hono } from "hono";

const document_post = new Hono();

document_post.post('/collections/:collection_name/documents', AuthMiddleware, async (c: any) => {
    const user = c.get('user');

    const { data: adminsData, error: adminsError } = await config.supabaseClient.from('admins').select('*');
    if (adminsData == undefined || adminsError != undefined || adminsData.length == 0 ||
        adminsData.find((admin: any) => admin.user_id == user.uid) == undefined
    )
        return c.json({ error: "You don't have admin privileges" }, 401);

    const { collection_name } = c.req.param();

    const json = await c.req.parseBody({ all: true });
    const files = json.files;

    const formData = new FormData();
    if (Array.isArray(files)) {
        for (const file of files)
            formData.append('files', file);
    } else
        formData.append('files', files);

    const headers = new Headers();
    headers.append("Authorization", `Bearer ${config.envVars.BEARER_TOKEN}`);
    headers.append("uid", 'global');

    let response: any;
    try {
        response = await fetch(`${config.envVars.IA_URL}/collections/${collection_name}`, {
            method: "POST",
            body: formData,
            headers: headers,
        });
    } catch (error: any) {
        if (error instanceof Error) {
            console.error("Fetch failed with error:", error.message);
            return c.json({ error: error.message }, 500);
        } else {
            console.error("Fetch failed with unknown error:", error);
            return c.json({ error: 'Unknown error' }, 500);
        }
    }

    const body = await response.json();
    return c.json({ response: body.message }, 200);
})

export default document_post;