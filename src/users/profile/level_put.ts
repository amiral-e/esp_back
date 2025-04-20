import { updateLevel } from "../../admins/profile/utils.ts";

async function put_level(c: any) {
	const user = c.get("user");

	return await updateLevel(c, user.uid);	
}

export default put_level;
