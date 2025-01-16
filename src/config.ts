const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_KEY', 'IA_URL', 'BEARER_TOKEN', 'JWT_SECRET'];

const missingEnvVars: string[] = [];

requiredEnvVars.forEach((variable) => {
  if (!process.env[variable]) {
    missingEnvVars.push(variable);
  }
});

if (missingEnvVars.length > 0) {
  console.error('Missing environment variables:', missingEnvVars);
  process.exit(1);
}

const envVars = {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_KEY: process.env.SUPABASE_KEY || '',
  IA_URL: process.env.IA_URL || '',
  BEARER_TOKEN: process.env.BEARER_TOKEN || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
};

import { createClient } from '@supabase/supabase-js';

let supabaseClient: any;

try {
  supabaseClient = createClient(envVars.SUPABASE_URL, envVars.SUPABASE_KEY);
} catch (error) {
  console.error('Failed to create Supabase client:', error);
}

export default {
  envVars,
  supabaseClient,
};