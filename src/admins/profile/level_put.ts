import { updateLevel } from "./utils.ts";

async function put_level(c: any) {
	const user = c.get("user");
	if (!user.admin) return c.json({ error: "Forbidden" }, 403);

	const { user_id } = await c.req.param();

	return await updateLevel(c, user_id);	
}

export default put_level;
