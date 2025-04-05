import config from "../config.ts";

async function isAdmin(id: string) {
	const { data } = await config.supabaseClient
		.from("admins")
		.select("*")
		.eq("uid", id)
		.single();
	return data != undefined;
}

async function insertAdmin(id: string) {
	if (await isAdmin(id)) return;
	const { error } = await config.supabaseClient
		.from("admins")
		.insert({ uid: id })
		.select("*")
		.single();
	if (error != undefined) console.error(error.message);
}

async function deleteAdmin(id: string) {
	if (!(await isAdmin(id))) return;
	const { error } = await config.supabaseClient
		.from("admins")
		.delete()
		.eq("uid", id)
		.select("*")
		.single();
	if (error != undefined) console.error(error.message);
}

export { isAdmin, insertAdmin, deleteAdmin };
