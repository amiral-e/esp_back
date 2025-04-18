import config from "../../config.ts";

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

async function deleteConversations(userId: string) {
    const { error } = await config.supabaseClient
        .from("conversations")
        .delete()
        .eq("user_id", userId);

    if (error != undefined)
        console.log(error.message);
}

export { createConversation, deleteConversation, deleteConversations };