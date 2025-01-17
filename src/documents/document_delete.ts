import config from '../config.ts';
import AuthMiddleware from "../middlewares.ts";
import { Hono } from "hono";

const document_delete = new Hono();

document_delete.delete('/:collection_name/documents/:document_id', AuthMiddleware, async (c: any) => {
    const user = c.get('user');
    const { collection_name, document_id } = c.req.param();
    const table_name = user.uid + '_' + collection_name;

    const { data: docsData, error: docsError } = await config.supabaseClient.schema('vecs').from(table_name).select('*').eq('metadata->>doc_id', document_id);
    if (docsData == undefined || docsData.length == 0)
        return c.json({ error: 'Document not found' }, 404);
    if (docsError != undefined)
        return c.json({ error: docsError.message }, 500);

    const { data, error } = await config.supabaseClient.schema('vecs').from(table_name).delete().eq('metadata->>doc_id', document_id);
    if (error != undefined)
        return c.json({ error: error.message }, 500);
    return c.json({ response: `Document ${document_id} deleted successfully` }, 200);
})

export default document_delete;