import config from "../config.ts";

/**
 * Checks if a user is an administrator.
 * 
 * @param id The ID of the user to check.
 * @returns A boolean indicating whether the user is an administrator.
 */
async function isAdmin(id: string) {
	const { data } = await config.supabaseClient
		.from("admins")
		.select("*")
		.eq("uid", id)
		.single();
	return data != undefined;
}

/**
 * Inserts a new administrator into the database.
 * 
 * @param id The ID of the user to insert as an administrator.
 */
async function insertAdmin(id: string) {
	if (await isAdmin(id)) return;
	const { error } = await config.supabaseClient
		.from("admins")
		.insert({ uid: id })
		.select("*")
		.single();
	if (error != undefined) console.error(error.message);
}

/**
 * Deletes an administrator from the database.
 * 
 * @param id The ID of the administrator to delete.
 */
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
