const requiredEnvVars = [
	"SUPABASE_URL",
	"SUPABASE_KEY",
	"POSTGRES_URL",
	"GROQ_API_KEY",
	"OPENAI_API_KEY",
	"IA_URL",
	"BEARER_TOKEN",
	"JWT_SECRET",
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
	SUPABASE_URL: process.env.SUPABASE_URL || "",
	SUPABASE_KEY: process.env.SUPABASE_KEY || "",
	POSTGRES_URL: process.env.POSTGRES_URL || "",
	IA_URL: process.env.IA_URL || "",
	BEARER_TOKEN: process.env.BEARER_TOKEN || "",
	JWT_SECRET: process.env.JWT_SECRET || "",
	GROQ_API_KEY: process.env.GROQ_API_KEY || "",
	OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
};

import { createClient } from "@supabase/supabase-js";

let supabaseClient: any;

try {
	supabaseClient = createClient(envVars.SUPABASE_URL, envVars.SUPABASE_KEY);
} catch (error) {
	console.error("Failed to create Supabase client:", error);
}

import { PGVectorStore, Groq, Settings } from "llamaindex";

const llm = new Groq({
	apiKey: envVars.GROQ_API_KEY,
	model: "llama-3.3-70b-versatile",
	temperature: 0.5,
	// maxTokens: 1000,
	timeout: 10000,
});

Settings.llm = llm;

const pgvs = new PGVectorStore({
	clientConfig: { connectionString: envVars.POSTGRES_URL },
});

export default {
	envVars,
	supabaseClient,
	pgvs,
	llm,
};
