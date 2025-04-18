import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import conversation from "./conversation_put.ts";
import { createConversation, deleteConversation } from "./utils.ts";

import config from "../../config.ts";
import { generatePayload } from "../../middlewares/utils.ts";

const userId = config.envVars.DUMMY_ID;
let dummyPayload = await generatePayload(userId);
let wrongPayload = await generatePayload(config.envVars.WRONG_ID);
let convId = "";

beforeAll(async () => {
	convId = await createConversation(userId, "test_conv");
});

afterAll(async () => {
    await deleteConversation(userId, convId);
});

describe("PUT /users/conversations (unauthorized)", () => {
    it("missing authorization header", async () => {
        const res = await conversation.request("/1", {
            method: "PUT",
            body: JSON.stringify({ name: "test_conv" }),
        });
        expect(res.status).toBe(401);
        expect(await res.json()).toEqual({
            error: "No authorization header found",
        });
    });

    it("invalid authorization header", async () => {
        const res = await conversation.request("/1", {
            method: "PUT",
            headers: { Authorization: "Bearer wrong-header" },
            body: JSON.stringify({ name: "test_conv" }),
        });
        expect(res.status).toBe(401);
        expect(await res.json()).toEqual({
            error: "Invalid authorization header",
        });
    });

    it("non-user authorization header", async () => {
        const res = await conversation.request("/1", {
            method: "PUT",
            headers: { Authorization: `Bearer ${wrongPayload}` },
            body: JSON.stringify({ name: "test_conv" }),
        });
        expect(res.status).toBe(401);
        expect(await res.json()).toEqual({
            error: "Invalid user",
        });
    }, 30000);
});

describe("PUT /users/conversations (invalid requests)", () => {
    it("invalid JSON body", async () => {
        const res = await conversation.request("/1", {
            method: "PUT",
            headers: { Authorization: `Bearer ${dummyPayload}` },
            body: "invalid-json",
        });
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: "Invalid JSON" });
    });

    it("missing required fields", async () => {
        const res = await conversation.request("/1", {
            method: "PUT",
            headers: { Authorization: `Bearer ${dummyPayload}` },
            body: JSON.stringify({}),
        });
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: "Invalid JSON" });
    });

    it("conversation not found", async () => {
        const res = await conversation.request("/999", {
            method: "PUT",
            headers: { Authorization: `Bearer ${dummyPayload}` },
            body: JSON.stringify({ name: "test_conv" }),
        });
        expect(res.status).toBe(404);
        expect(await res.json()).toEqual({
            error: "Conversation not found",
        });
    });
});

describe("PUT /users/conversations (valid requests)", () => {
    it("should update an existing conversation", async () => {
        // Now update it using PUT
        const putRes = await conversation.request(`/${convId}`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${dummyPayload}` },
            body: JSON.stringify({ name: "updated_conv" }),
        });
        
        expect(putRes.status).toBe(200);
        expect(await putRes.json()).toEqual({
            message: `Conversation updated successfully`,
        });
    });
});