import { describe, expect, it, beforeEach, beforeAll, afterAll } from "bun:test";
import collection_delete from "./collection_delete.ts";
import { createCollection, deleteCollection } from "./utils.ts";

import envVars from "../../config_test.ts";

const userId = envVars.DUMMY_ID;
var collectionName = `${userId}_test_collection`;

/* afterAll(async () => {
    // Nettoyer la collection de test
    await deleteCollection(collectionName);
}); */

describe("DELETE /users/collections/:collection_name (unauthorized)", () => {
    it("missing authorization header", async () => {
        const res = await collection_delete.request(`/${collectionName}`, {
            method: "DELETE",
        });
        expect(await res.json()).toEqual({
            error: "No authorization header found",
        });
        expect(res.status).toBe(401);
    });

    it("invalid authorization header", async () => {
        const res = await collection_delete.request(`/${collectionName}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer wrong-header` },
        });
        expect(await res.json()).toEqual({
            error: "Invalid authorization header",
        });
        expect(res.status).toBe(401);
    });

    it("non-user authorization header", async () => {
        const res = await collection_delete.request(`/${collectionName}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${envVars.WRONG_JWT_PAYLOAD}` },
        });
        expect(await res.json()).toEqual({
            error: "Invalid user",
        });
        expect(res.status).toBe(401);
    });
});

describe("DELETE /users/collections/:collection_name (authorized)", () => {
    it("should return 404 when collection not found", async () => {
        const res = await collection_delete.request(`/${collectionName}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${envVars.DUMMY_JWT_PAYLOAD}` },
        });
        
        expect(res.status).toBe(404);
        expect(await res.json()).toEqual({
            error: "Collection not found",
        });
    });

    it("should delete collection successfully", async () => {
        // Create a test collection first
        await createCollection(userId, collectionName);

        const res = await collection_delete.request('test_collection', {
            method: "DELETE",
            headers: { Authorization: `Bearer ${envVars.DUMMY_JWT_PAYLOAD}` },
        });
        
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({
            message: `Collection deleted successfully`
        });
    });

    /* it("should handle internal server error", async () => {
        // Simuler une erreur interne
        const res = await collection_delete.request(`/${collectionName}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${envVars.DUMMY_JWT_PAYLOAD}` },
        });
        
        // Si l'erreur se produit pendant la suppression
        if(res.status === 500) {
            expect(await res.json()).toEqual({
                error: expect.any(String)
            });
        }
    }); */
});