import config from "../../config.ts";

async function decrease_credits(tokens: number, id: string, type: number) {
    const { data: price, error: price_error } = await config.supabaseClient
        .from("prices")
        .select("*")
        .eq("id", type)
        .single();

    if (price_error != undefined) return "Error while getting price";

    let usage = tokens * price.value / 10000;

    const { data: credits, error: credits_error } = await config.supabaseClient
        .from("profiles")
        .select("credits")
        .eq("id", id)
        .single();

    if (credits_error != undefined)
        return "Error while getting credits";

    if (credits.credits < usage) return "Not enough credits";
    const new_credits = credits.credits - usage;

    const { error } = await config.supabaseClient
        .from("profiles")
        .update({ credits: new_credits })
        .eq("id", id)
        .single();
    if (error != undefined) return "Error while decreasing credits";

    return "Success";
}

export { decrease_credits };