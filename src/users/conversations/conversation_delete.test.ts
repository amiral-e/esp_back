import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import conversation from "./conversation_delete.ts";
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

describe("DELETE /users/conversations/:conv_id (unauthorized)", () => {
    it("missing authorization header", async () => {
        const res = await conversation.request(`/${convId}`, {
            method: "DELETE",
        });
        expect(await res.json()).toEqual({
            error: "No authorization header found",
        });
        expect(res.status).toBe(401);
    });

    it("invalid authorization header", async () => {
        const res = await conversation.request(`/${convId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer wrong-header` },
        });
        expect(await res.json()).toEqual({
            error: "Invalid authorization header",
        });
        expect(res.status).toBe(401);
    });

    it("non-user authorization header", async () => {
        const res = await conversation.request(`/${convId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${wrongPayload}` },
        });
        expect(await res.json()).toEqual({
            error: "Invalid user",
        });
        expect(res.status).toBe(401);
    });
});

describe("DELETE /users/conversations/:conv_id (authorized)", () => {
    it("should delete existing conversation", async () => {
        const res = await conversation.request(`/${convId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${dummyPayload}` },
        });
        
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toEqual({
            message: "Conversation deleted successfully"
        });
    });

    it("should return 404 when conversation not found", async () => {
        const res = await conversation.request(`/nonexistent_conv`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${dummyPayload}` },
        });
        
        expect(res.status).toBe(404);
        expect(await res.json()).toEqual({
            error: "Conversation not found",
        });
    });
});