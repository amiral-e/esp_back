import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import conversation from "./conversation_post.ts";
import { deleteConversation } from "./utils.ts";

import envVars from "../../config_test.ts";

const userId = envVars.DUMMY_ID;
var convId = "";

afterAll(async () => {
    await deleteConversation(userId, convId);
});

describe("POST /users/conversations (unauthorized)", () => {
    it("missing authorization header", async () => {
        const res = await conversation.request("/", {
            method: "POST",
            body: JSON.stringify({ name: "test_conv" }),
        });
        expect(await res.json()).toEqual({
            error: "No authorization header found",
        });
        expect(res.status).toBe(401);
    });

    it("invalid authorization header", async () => {
        const res = await conversation.request("/", {
            method: "POST",
            headers: { Authorization: "Bearer wrong-header" },
            body: JSON.stringify({ name: "test_conv" }),
        });
        expect(await res.json()).toEqual({
            error: "Invalid authorization header",
        });
        expect(res.status).toBe(401);
    });

    it("non-user authorization header", async () => {
        const res = await conversation.request("/", {
            method: "POST",
            headers: { Authorization: `Bearer ${envVars.WRONG_JWT_PAYLOAD}` },
        });
        expect(await res.json()).toEqual({
            error: "Invalid user",
        });
        expect(res.status).toBe(401);
    }, 30000);
});

describe("POST /users/conversations (invalid requests)", () => {
    it("invalid JSON body", async () => {
        const res = await conversation.request("/", {
            method: "POST",
            headers: { Authorization: `Bearer ${envVars.DUMMY_JWT_PAYLOAD}` },
            body: "invalid-json",
        });
        expect(await res.json()).toEqual({ error: "Invalid JSON" });
        expect(res.status).toBe(400);
    });

    it("missing required fields", async () => {
        const res = await conversation.request("/", {
            method: "POST",
            headers: { Authorization: `Bearer ${envVars.DUMMY_JWT_PAYLOAD}` },
            body: JSON.stringify({}),
        });
        expect(await res.json()).toEqual({ error: "Invalid JSON" });
        expect(res.status).toBe(400);
    });
});

describe("POST /users/conversations (valid requests)", () => {
    it("should create a new conversation", async () => {
        const res = await conversation.request("/", {
            method: "POST",
            headers: { Authorization: `Bearer ${envVars.DUMMY_JWT_PAYLOAD}` },
            body: JSON.stringify({ name: "test_conv" }),
        });
        
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toContainKeys(['message', 'id']);
        expect(body.message).toEqual(`Conversation test_conv created successfully with id ${body.id}`);
    });
});