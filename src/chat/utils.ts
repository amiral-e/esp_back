import config from "../config.ts";


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

async function add_context_to_query(history: any[], query: string): Promise<string> {
    try {
        const response = await config.llm.chat({ messages: [{ role: "user", content: get_prompt(history, query) }] });
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

export default add_context_to_query;