import config from "../../config.ts";

async function decrease_credits(tokens: number, id: string, type: string) {
    const { data: price, error: price_error } = await config.supabaseClient
        .from("prices")
        .select("*")
        .eq("price", type)
        .single();

    if (price_error != undefined) return "Error while getting price";

    let usage = 0;
    if (type == "search") usage = price.value;
    else usage = tokens * price.value / 10000;

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

async function check_credits(tokens: number, uid: string, search: boolean, doc: boolean) {
    const { data: prices, error: price_error } = await config.supabaseClient
        .from("prices")
        .select("*")
        .order('price', { ascending: true });

    if (price_error != undefined) return "Error while getting price";

    let total_usage = 0;
    if (!doc) {
        total_usage += tokens * prices[0].value / 10000;
        total_usage += 1000 * prices[1].value / 10000;
        if (search)
            total_usage += prices[3].value;
    } else
        total_usage += tokens * prices[2].value / 10000;

    const { data: credits, error: credits_error } = await config.supabaseClient
        .from("profiles")
        .select("credits")
        .eq("id", uid)
        .single();

    if (credits_error != undefined)
        return "Error while getting credits";

    if (credits.credits < total_usage) return "Fail";
    return "Success";
}

export { decrease_credits, check_credits };