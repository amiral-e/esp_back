import config from '../config.ts';
import AuthMiddleware from "../auth_middleware.ts";
import { Hono } from "hono";

const admin_insert = new Hono();

admin_insert.post(AuthMiddleware, async (c: any) => {
    const user = c.get('user');
    let json: any;
    try {
        json = await c.req.json();
        if (!json || json.user_id == undefined)
            return c.json({ error: 'Invalid JSON' }, 400);
    } catch (error) {
        return c.json({ error: 'Invalid JSON' }, 400);
    }

    if (user.uid == json.user_id)
        return c.json({ error: "You can't add yourself to admins" }, 401);

    const { data: adminsData, error: adminsError } = await config.supabaseClient.from('admins').select('*');
    if (adminsData == undefined || adminsError != undefined || adminsData.length == 0 ||
        adminsData.find((admin: any) => admin.user_id == user.uid) == undefined
    )
        return c.json({ error: "You don't have admin privileges" }, 401);
    if (adminsData.find((admin: any) => admin.user_id == json.user_id) != undefined)
        return c.json({ error: "User is already an admin" }, 401);

    const { data: insertionData, error: insertionError } = await config.supabaseClient.from('admins').insert({ user_id: json.user_id }).select('*');
    if (insertionError != undefined)
        return c.json({ error: insertionError.message }, 500);
    else if (insertionData == undefined || insertionData.length == 0)
        return c.json({ error: "User doesn't exist in database" }, 401);
    return c.json({ "message": `User ${json.user_id} added to admins` }, 200);
})

export default admin_insert;