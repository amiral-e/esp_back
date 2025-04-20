import config from "../../config.ts";

async function get_admins(c: any) {
	const user = c.get("user");
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	const admins = await config.supabaseClient.from("admins").select("uid");

	for (const admin of admins.data) {
		const email = await config.supabaseClient.rpc("get_email", {
			user_id: admin.uid,
		});
		admin.email = email.data;
	}
	return c.json({ admins: admins.data }, 200);
}

export default get_admins;
