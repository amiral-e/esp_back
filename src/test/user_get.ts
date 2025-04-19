async function get_user(c: any) {
	const user = c.get("user");
	return c.json({
		message: "Here is your infos",
		user: user,
	});
}

export default get_user;
