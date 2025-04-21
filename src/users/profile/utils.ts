import config from "../../config.ts";

/**
 * Decreases the credits of a user based on the tokens used and the type of usage.
 * 
 * @param tokens The number of tokens used.
 * @param id The ID of the user.
 * @param type The type of usage (e.g. search, doc, etc.).
 * @returns A promise resolving with a message indicating whether the credits were successfully decreased.
 */
async function decrease_credits(tokens: number, id: string, type: string) {
  // Retrieve the price of the usage type from the supabase database
  const { data: price, error: price_error } = await config.supabaseClient
    .from("prices")
    .select("*")
    .eq("price", type)
    .single();

  // Check if an error occurred while retrieving the price
  if (price_error != undefined) return "Error while getting price";

  // Calculate the usage cost based on the type of usage
  let usage = 0;
  if (type == "search") {
    // For search usage, the cost is the price value
    usage = price.value;
  } else {
    // For other usage types, the cost is calculated based on the number of tokens used
    usage = (tokens * price.value) / 10000;
  }

  // Retrieve the current credits of the user from the supabase database
  const { data: credits, error: credits_error } = await config.supabaseClient
    .from("profiles")
    .select("credits")
    .eq("id", id)
    .single();

  // Check if an error occurred while retrieving the user's credits
  if (credits_error != undefined) return "Error while getting credits";

  // Check if the user has enough credits to cover the usage cost
  if (credits.credits < usage) return "Not enough credits";
  
  // Calculate the new credits after deducting the usage cost
  const new_credits = credits.credits - usage;

  // Update the user's credits in the supabase database
  const { error } = await config.supabaseClient
    .from("profiles")
    .update({ credits: new_credits })
    .eq("id", id)
    .single();
  
  // Check if an error occurred while updating the user's credits
  if (error != undefined) return "Error while decreasing credits";

  // Return a success message if the credits were successfully decreased
  return "Success";
}

/**
 * Checks if a user has enough credits for a specific usage scenario.
 * 
 * @param tokens The number of tokens used.
 * @param uid The ID of the user.
 * @param search Whether the usage involves a search.
 * @param doc Whether the usage involves a document.
 * @returns A promise resolving with a message indicating whether the user has enough credits.
 */
async function check_credits(
  tokens: number,
  uid: string,
  search: boolean,
  doc: boolean,
) {
  // Retrieve the prices of all usage types from the supabase database
  const { data: prices, error: price_error } = await config.supabaseClient
    .from("prices")
    .select("*")
    .order("price", { ascending: true });

  // Check if an error occurred while retrieving the prices
  if (price_error != undefined) return "Error while getting price";

  // Initialize the total usage cost to zero
  let total_usage = 0;
  
  // Calculate the total usage cost based on the usage scenario
  if (!doc) {
    // For non-document usage, calculate the cost based on the number of tokens used
    total_usage += (tokens * prices[0].value) / 10000;
    // Add the cost of the document (even if it's not a document usage)
    total_usage += (1000 * prices[1].value) / 10000;
    // If search is involved, add the search cost
    if (search) total_usage += prices[3].value;
  } else {
    // For document usage, calculate the cost based on the number of tokens used
    total_usage += (tokens * prices[2].value) / 10000;
  }

  // Retrieve the current credits of the user from the supabase database
  const { data: credits, error: credits_error } = await config.supabaseClient
    .from("profiles")
    .select("credits")
    .eq("id", uid)
    .single();

  // Check if an error occurred while retrieving the user's credits
  if (credits_error != undefined) return "Error while getting credits";

  // Check if the user has enough credits to cover the total usage cost
  if (credits.credits < total_usage) return "Fail";
  
  // Return a success message if the user has enough credits
  return "Success";
}

export { decrease_credits, check_credits };