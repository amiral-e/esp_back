import { createClient } from '@supabase/supabase-js'
import { expect, test, beforeAll } from "bun:test";
import routes_convs from "../conversations/index.ts";

const supabase = createClient(process.env.DATABASE_URL || '', process.env.PUBLIC_API_KEY || '')
var access_token = ""
var refresh_token = ""
var conv_id = ""

beforeAll(async () => {
    const { data: {session}, error } = await supabase.auth.signInWithPassword({
        email: process.env.ADMIN_EMAIL || "",
        password: process.env.ADMIN_PASSWORD || "",
    })
    access_token = session?.access_token || ""
    refresh_token = session?.refresh_token || ""
});

test("Test post message", async () => {
    const res = await routes_convs.request('/', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'access_token': access_token,
            'refresh_token': refresh_token
        },
        body: JSON.stringify({
            conv_id: "0",
            message: "Test conversation"
        })
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body).toBeObject()
    expect(body).toContainKey('id')
    conv_id = body.id
})

test("Test get conversation by id", async () => {
    const res = await routes_convs.request(`/${conv_id}`, {
        method: 'GET',
        headers: {
            'access_token': access_token,
            'refresh_token': refresh_token
        }
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body).toBeObject()
    expect(body).toContainAllKeys(['conv', 'name', 'id'])
})

test("Test get user conversations", async () => {
    const res = await routes_convs.request('/', {
        method: 'GET',
        headers: {
            'access_token': access_token,
            'refresh_token': refresh_token
        }
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body).toBeObject()
    expect(body).toContainAllKeys(['convs'])
    expect(body.convs.length).toBeGreaterThan(0)
    expect(body.convs[0]).toBeObject()
    expect(body.convs[0]).toContainAllKeys(['id', 'created_at', 'history', 'user_id', 'name'])
})

test("Test update conversation", async () => {
    const res = await routes_convs.request('/', {
        method: 'PATCH',
        body: JSON.stringify({
            conv_id: String(conv_id),
            name: "New Name"
        }),
        headers: {
            'content-type': 'application/json',
            'access_token': access_token,
            'refresh_token': refresh_token
        }
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body).toBeObject()
    expect(body).toContainAllKeys(['message', 'id'])
    expect(body.message).toEqual("Conversation name updated to New Name")
    expect(body.id).toEqual(conv_id)
})

test("Test delete conversation", async () => {
    const res = await routes_convs.request('/', {
        method: 'DELETE',
        body: JSON.stringify({
            conv_id: String(conv_id),
        }),
        headers: {
            'content-type': 'application/json',
            'access_token': access_token,
            'refresh_token': refresh_token
        }
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body).toBeObject()
    expect(body).toContainAllKeys(['message', 'id'])
    expect(body.id).toEqual(String(conv_id))
    expect(body.message).toEqual("Conversation deleted")
})