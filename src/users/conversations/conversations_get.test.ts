import { describe, expect, it, beforeEach, beforeAll, afterAll } from "bun:test";
import conversations from "./conversations_get.ts";
import { createConversation, deleteConversation } from "./utils.ts";

import config from "../../config.ts";
import { generatePayload } from "../../middlewares/utils.ts";

const userId = config.envVars.DUMMY_ID;
let dummyPayload = await generatePayload(userId);
let wrongPayload = await generatePayload(config.envVars.WRONG_ID);
var cleanupConversations: string[] = [];
var convId: string = "";

/* afterAll(async () => {
    // Nettoyer toutes les conversations de test
    for (const convId of cleanupConversations) {
        await deleteConversation(userId, convId);
    }
}); */

describe("GET /users/conversations (unauthorized)", () => {
    it("missing authorization header", async () => {
        const res = await conversations.request("/", {
            method: "GET",
        });
        expect(await res.json()).toEqual({
            error: "No authorization header found",
        });
        expect(res.status).toBe(401);
    });

    it("invalid authorization header", async () => {
        const res = await conversations.request("/", {
            method: "GET",
            headers: { Authorization: "Bearer wrong-header" },
        });
        expect(await res.json()).toEqual({
            error: "Invalid authorization header",
        });
        expect(res.status).toBe(401);
    });

    it("non-user authorization header", async () => {
        const res = await conversations.request("/", {
            method: "GET",
            headers: { Authorization: `Bearer ${wrongPayload}` },
        });
        expect(await res.json()).toEqual({
            error: "Invalid user",
        });
        expect(res.status).toBe(401);
    });
});

describe("GET /users/conversations (authorized)", () => {
    it("should return 200 when conversations exist", async () => {
        // Créer quelques conversations pour tester
        convId = await createConversation(userId, "test_convId");

        const res = await conversations.request("/", {
            method: "GET",
            headers: { Authorization: `Bearer ${dummyPayload}` },
        });

        expect(res.status).toBe(200);
        const body = await res.json();

        expect(body).toContainKeys(['conversations']);
        expect(body.conversations).toBeInstanceOf(Array);
        expect(body.conversations.length).toBeGreaterThan(0);
    });

    it("should return 404 when no conversations found", async () => {
        // Nettoyer toutes les conversations de test
        await deleteConversation(userId, convId);

        // Utiliser un utilisateur qui n'a pas de conversations
        const res = await conversations.request("/", {
            method: "GET",
            headers: { Authorization: `Bearer ${dummyPayload}` },
        });

        expect(res.status).toBe(404);
        expect(await res.json()).toEqual({
            error: "No conversations found",
        });
    });
});