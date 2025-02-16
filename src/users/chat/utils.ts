import config from "../../config.ts";

import {
	Document,
	storageContextFromDefaults,
	VectorStoreIndex,
} from "llamaindex";

function get_prompt(history: any[], query: string): string {
	const context_prompt = `Chat history is below.
---------------------
${JSON.stringify(history)}
---------------------
If the chat history is revelant to the query, modify the query to incorporate the chat history.
If it's not relevant, return the query unchanged.
Don't answer the user's message directly or introduce additional information.

Query: ${query}
New query:`;

	return context_prompt;
}

async function add_context_to_query(
	history: any[],
	query: string,
): Promise<string> {
	try {
		const response = await config.llm.chat({
			messages: [{ role: "user", content: get_prompt(history, query) }],
		});
		return response.message.content as string;
	} catch (error: any) {
		console.error("LLM Error:", error instanceof Error ? error.message : error);
		if (error.message?.toLowerCase().includes("rate_limit_exceeded")) {
			console.log("Hit rate limit. Consider implementing retry logic.");
			throw new Error("Rate limit exceeded");
		}
		throw new Error("Failed to process message");
	}
}

async function createConversation(userId: string, conversationName: string) {
    const { data, error } = await config.supabaseClient
        .from("conversations")
        .insert({
            history: [],
            name: conversationName,
            user_id: userId
        })
        .select("*")
        .single();
    if (data == undefined || error != undefined) 
        console.log(error.message);

    return data.id;
}

async function deleteConversation(
    userId: string,
    convId: string
) {
    const { error } = await config.supabaseClient
        .from("conversations")
        .delete()
        .eq("id", convId)
        .eq("user_id", userId);

    if (error != undefined)
        console.log(error.message);
}

async function createCollection(userId: string, collectionName: string) {
    try {
        // Create a test document
        const fileContents = "This is a test document";
        const testDoc = new Document({
            text: fileContents,
            metadata: {
                // @ts-ignore
                doc_id: Bun.randomUUIDv7(),
                doc_file: "test.txt",
                user: userId,
            },
        })

        // Set up vector store
        config.pgvs.setCollection(collectionName);
        
        // Create storage context and index
        const ctx = await storageContextFromDefaults({ vectorStore: config.pgvs });
        const index = await VectorStoreIndex.fromDocuments([testDoc], {
            storageContext: ctx,
        });
    }
    catch (error: any) {
        console.error("Error creating collection:", error.message);
        return false;
    }
}

async function deleteCollection(collectionName: string) {
    const { data, error: lookupError } = 
        await config.supabaseClient
            .from("llamaindex_embedding")
            .select("id, collection")
            .eq("collection", collectionName);

    if (!data || data.length === 0) {
        throw new Error("Collection not found");
    }
    if (lookupError) {
        throw lookupError;
    }

    // Delete all embeddings in the collection
    for (const item of data) {
        const { error: deleteError } = 
            await config.supabaseClient
                .from("llamaindex_embedding")
                .delete()
                .eq("id", item.id);
                
        if (deleteError) {
            throw deleteError;
        }
    }
}

export { add_context_to_query, createConversation, deleteConversation, createCollection, deleteCollection };
