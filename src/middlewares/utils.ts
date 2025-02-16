import config from "../config.ts";

async function getUser(uid: string) {
	const is_valid = await config.supabaseClient.rpc("is_valid_uid", {
		user_id: uid,
	});
	if (is_valid.error) is_valid.data = false;

	const is_admin = await config.supabaseClient.rpc("is_admin_uid", {
		user_id: uid,
	});
	if (is_admin.error) is_admin.data = false;

	return {
		valid: is_valid.data,
		admin: is_admin.data,
	};
}

export { getUser };
