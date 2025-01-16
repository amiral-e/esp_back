import config from '../config.ts';
import AuthMiddleware from "../auth_middleware.ts";
import { Hono } from "hono";

const documents_get = new Hono();

documents_get.get('/collections/:collection_name/documents', AuthMiddleware, async (c: any) => {
    const user = c.get('user');

    const { data: adminsData, error: adminsError } = await config.supabaseClient.from('admins').select('*');
    if (adminsData == undefined || adminsError != undefined || adminsData.length == 0 ||
        adminsData.find((admin: any) => admin.user_id == user.uid) == undefined
    )
        return c.json({ error: "You don't have admin privileges" }, 401);

    const { collection_name } = c.req.param();
    const table_name = 'global_' + collection_name;

    const { data, error } = await config.supabaseClient.schema('vecs').from(table_name).select('*');
    if (data == undefined || data.length == 0)
        return c.json({ error: 'Collection not found' }, 404);
    else if (error)
        return c.json({ error: error.message }, 500);

    const doc_ids = [...new Set(data.map((x: any) => x.metadata.doc_id))];
    return c.json({ response: { doc_ids: doc_ids } }, 200);
})

export default documents_get;