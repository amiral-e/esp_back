import config from '../config.ts';

async function isAdmin(id: string) {
    const { data, error } = await config.supabaseClient.from('admins').select('*').eq('user_id', id).single()
    return data != undefined;
}

async function insertAdmin(id: string) {
    if (await isAdmin(id))
        return;
    const { data, error } = await config.supabaseClient.from('admins').insert({ user_id: id }).select('*').single()
    if (error != undefined)
        console.error(error.message);
}

async function deleteAdmin(id: string) {
    if (!(await isAdmin(id)))
        return;
    const { data, error } = await config.supabaseClient.from('admins').delete().eq('user_id', id).select('*').single()
    if (error != undefined)
        console.error(error.message);
}

export { isAdmin, insertAdmin, deleteAdmin };