import config from "../../config.ts";
import { validateRequest } from "./utils.ts"

/**
 * Creates a new question in the database.
 * 
 * @param c The context object containing the HTTP request and response.
 * @returns A JSON response indicating whether the question was created successfully.
 */
async function post_question(c: any) {
  // First, we check if the user making the request is an admin.
  const user = c.get("user");
  if (!user.admin) return c.json({ error: "Forbidden" }, 403);

  // Next, we validate the incoming request to ensure it's in the correct format.
  const json = await validateRequest(c);
  if (json instanceof Response) return json;

  // Now, we attempt to insert the new question into the database.
  const insertion = await config.supabaseClient
    .from("questions")
    .insert({ question: json.question, level: json.level })
    .select("*")
    .single();
  
  // If there's an error with the insertion, we return a 500 error with the error message.
  if (insertion.error != undefined)
    return c.json({ error: insertion.error.message }, 500);

  // If the insertion is successful, we return a 200 response with a success message and the ID of the new question.
  return c.json(
    { message: "Question added successfully", id: insertion.data.id },
    200,
  );
}

export default post_question;