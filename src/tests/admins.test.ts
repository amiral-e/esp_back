import { createClient } from '@supabase/supabase-js'
import { expect, test, beforeAll } from "bun:test";
import routes_admins from "../admins/index.ts";

const supabase = createClient(process.env.DATABASE_URL || '', process.env.PUBLIC_API_KEY || '')
var access_token = ""
var refresh_token = ""

beforeAll(async () => {
    const { data: {session}, error } = await supabase.auth.signInWithPassword({
        email: process.env.ADMIN_EMAIL || "",
        password: process.env.ADMIN_PASSWORD || "",
    })
    access_token = session?.access_token || ""
    refresh_token = session?.refresh_token || ""
});

test("Test add admin route", async () => {
    const res = await routes_admins.request('/', {
        method: 'POST',
        body: JSON.stringify({
            access_token: access_token,
            refresh_token: refresh_token,
            user_id: "a8152534-f7c1-49f8-8b36-dc946035d6a8"
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    expect(res.status).toBe(200)
})

test("Test remove admin route", async () => {
    const res = await routes_admins.request('/', {
        method: 'DELETE',
        body: JSON.stringify({
            access_token: access_token,
            refresh_token: refresh_token,
            user_id: "a8152534-f7c1-49f8-8b36-dc946035d6a8"
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    expect(res.status).toBe(200)
})