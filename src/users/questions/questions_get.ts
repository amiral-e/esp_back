import config from "../../config.ts";

/**
 * Retrieves questions for the current user based on their level.
 * 
 * @param c The context object containing information about the current user.
 * @returns A JSON response containing an array of questions or an error message if no questions are found.
 */
async function get_questions(c: any) {
  // Get the current user from the context object
  const user = c.get("user");

  // Retrieve the user's profile information from the database
  const profile = await config.supabaseClient
    .from("profiles")
    .select("level")
    .eq("id", user.uid)
    .single();

  // Fetch questions from the database that match the user's level
  const questions = await config.supabaseClient
    .from("questions")
    .select("question")
    .eq("level", profile.data.level);

  // Check if any questions were found
  if (questions.data == undefined || questions.data.length == 0)
    // If no questions are found, return a 404 error with a message
    return c.json({ error: "No questions found" }, 404);

  // If questions are found, return a 200 response with the questions
  return c.json({ questions: questions.data.map((l: any) => l.question) }, 200);
}

export default get_questions;