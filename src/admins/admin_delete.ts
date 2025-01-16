import config from '../config.ts';
import AuthMiddleware from "../auth_middleware.ts";
import { Hono } from "hono";

const admin_delete = new Hono();

admin_delete.delete(AuthMiddleware, async (c: any) => {
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
        return c.json({ error: "You can't remove yourself from admins" }, 401);

    const { data: adminsData, error: adminsError } = await config.supabaseClient.from('admins').select('*');
    if (adminsData == undefined || adminsError != undefined || adminsData.length == 0 ||
        adminsData.find((admin: any) => admin.user_id == user.uid) == undefined
    )
        return c.json({ error: "You don't have admin privileges" }, 401);
    if (adminsData.find((admin: any) => admin.user_id == json.user_id) == undefined)
        return c.json({ error: "User is not an admin" }, 401);

    const { data: deletionData, error: deletionError } = await config.supabaseClient.from('admins').delete().eq('user_id', json.user_id).select('*').single();
    if (deletionError != undefined)
        return c.json({ error: deletionError.message }, 500);
    return c.json({ "message": `User ${json.user_id} removed from admins` }, 200);
})

export default admin_delete;