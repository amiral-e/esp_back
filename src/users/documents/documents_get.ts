import config from "../../config.ts";

async function get_documents(c: any) {
	const user = c.get("user");
	const { collection_name } = c.req.param();
	const collection_id = user.uid + "_" + collection_name;

	const documents = await config.supabaseClient
		.from("llamaindex_embedding")
		.select("id, collection, metadata")
		.eq("collection", collection_id);
	if (documents.data == undefined || documents.data.length == 0)
		return c.json({ error: "Collection not found" }, 404);
	else if (documents.error != undefined)
		return c.json({ error: documents.error.message }, 500);

	const docs = documents.data.reduce((acc: any[], x: any) => {
		if (!acc.some((y) => y.doc_id === x.metadata.doc_id))
			acc.push({ doc_id: x.metadata.doc_id, doc_file: x.metadata.doc_file });
		return acc;
	}, []);
	return c.json({ documents: docs }, 200);
}

export default get_documents;
