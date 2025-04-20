import { deleteCollection } from "../../admins/collections/utils.ts";

async function delete_collection(c: any) {
	const user = c.get("user");
	const { collection_name } = c.req.param();
	const collection_id = user.uid + "_" + collection_name;

	return await deleteCollection(c, collection_id);
}

export default delete_collection;
