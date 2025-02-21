import { describe, expect, it, beforeEach, beforeAll, afterAll } from "bun:test";
import documents from "./documents_get.ts";
import { createCollection, deleteCollection } from "../collections/utils.ts";

import envVars from "../../config_test.ts";

const userId = envVars.DUMMY_ID;
var collectionName = `${userId}_test_collection`;
var collectionId = `${userId}_${collectionName}`;

afterAll(async () => {
    // Nettoyer la collection et les documents de test
    await deleteCollection(collectionName);
});

describe("GET /users/:collection_name/documents (unauthorized)", () => {
    it("missing authorization header", async () => {
        const res = await documents.request(`/${collectionName}/documents`, {
            method: "GET",
        });
        expect(await res.json()).toEqual({
            error: "No authorization header found",
        });
        expect(res.status).toBe(401);
    });

    it("invalid authorization header", async () => {
        const res = await documents.request(`/${collectionName}/documents`, {
            method: "GET",
            headers: { Authorization: `Bearer wrong-header` },
        });
        expect(await res.json()).toEqual({
            error: "Invalid authorization header",
        });
        expect(res.status).toBe(401);
    });

    it("non-user authorization header", async () => {
        const res = await documents.request(`/${collectionName}/documents`, {
            method: "GET",
            headers: { Authorization: `Bearer ${envVars.WRONG_JWT_PAYLOAD}` },
        });
        expect(await res.json()).toEqual({
            error: "Invalid user",
        });
        expect(res.status).toBe(401);
    });
});

describe("GET /users/:collection_name/documents (authorized)", () => {
    it("should return 404 when collection not found", async () => {
        const res = await documents.request(`/${collectionName}/documents`, {
            method: "GET",
            headers: { Authorization: `Bearer ${envVars.DUMMY_JWT_PAYLOAD}` },
        });
        expect(res.status).toBe(404);
        expect(await res.json()).toEqual({
            error: "Collection not found",
        });
    });

    it("should return documents for collection", async () => {
        // Create test collection and document
        await createCollection(userId, collectionName);

        const res = await documents.request(`/test_collection/documents`, {
            method: "GET",
            headers: { Authorization: `Bearer ${envVars.DUMMY_JWT_PAYLOAD}` },
        });
        
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty("documents");
        expect(body.documents).toBeInstanceOf(Array);
        expect(body.documents).toHaveLength(1);
    });
});