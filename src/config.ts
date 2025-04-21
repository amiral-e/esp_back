/**
 * Checks for required environment variables and creates instances of Supabase and LlamaIndex clients.
 * 
 * @returns An object containing the environment variables, Supabase client, PGVectorStore instance, and LlamaIndex instance.
 */
const requiredEnvVars = [
	"SUPABASE_URL",
	"SUPABASE_KEY",
	"POSTGRES_URL",
	"GROQ_API_KEY",
	"OPENAI_API_KEY",
	"JWT_SECRET",
	"ADMIN_ID",
	"DUMMY_ID",
	"DUMMY2_ID",
	"WRONG_ID",
];

const missingEnvVars: string[] = [];

requiredEnvVars.forEach((variable) => {
	if (!process.env[variable]) {
		missingEnvVars.push(variable);
	}
});

if (missingEnvVars.length > 0) {
	console.error("Missing environment variables:", missingEnvVars);
	process.exit(1);
}

const envVars = {
	SUPABASE_URL: process.env.SUPABASE_URL ?? "",
	SUPABASE_KEY: process.env.SUPABASE_KEY ?? "",
	POSTGRES_URL: process.env.POSTGRES_URL ?? "",
	GROQ_API_KEY: process.env.GROQ_API_KEY ?? "",
	OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
	JWT_SECRET: process.env.JWT_SECRET ?? "",
	ADMIN_ID: process.env.ADMIN_ID ?? "",
	DUMMY_ID: process.env.DUMMY_ID ?? "",
	DUMMY2_ID: process.env.DUMMY2_ID ?? "",
	WRONG_ID: process.env.WRONG_ID ?? "",
};

/**
 * Creates a Supabase client instance.
 * 
 * @param url The Supabase URL.
 * @param key The Supabase key.
 * 
 * @returns A Supabase client instance.
 */
import { createClient } from "@supabase/supabase-js";

let supabaseClient: any;

try {
	supabaseClient = createClient(envVars.SUPABASE_URL, envVars.SUPABASE_KEY);
} catch (error) {
	console.error("Failed to create Supabase client:", error);
}

import { PGVectorStore, Groq, Settings } from "llamaindex";

/**
 * Creates a LlamaIndex instance.
 * 
 * @param apiKey The API key for the LlamaIndex instance.
 * @param model The model to use for the LlamaIndex instance.
 * @param temperature The temperature to use for the LlamaIndex instance.
 * @param timeout The timeout to use for the LlamaIndex instance.
 * 
 * @returns A LlamaIndex instance.
 */
const llm = new Groq({
	apiKey: envVars.GROQ_API_KEY,
	model: "llama-3.3-70b-versatile",
	temperature: 0.5,
	// maxTokens: 1000,
	timeout: 10000,
});

Settings.llm = llm;

/**
 * Creates a PGVectorStore instance.
 * 
 * @param clientConfig The client configuration for the PGVectorStore instance.
 * 
 * @returns A PGVectorStore instance.
 */
const pgvs = new PGVectorStore({
	clientConfig: { connectionString: envVars.POSTGRES_URL },
});

export default {
	envVars,
	supabaseClient,
	pgvs,
	llm,
};
