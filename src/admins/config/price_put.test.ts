import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import price from "./price_put_def.ts";
import { createPrice, deletePrice } from "./utils.ts";

import { generatePayload } from "../../middlewares/utils.ts";
import config from "../../config.ts";

const adminId = config.envVars.ADMIN_ID;
const userId = config.envVars.DUMMY_ID;
let adminPayload = await generatePayload(adminId);
let userPayload = await generatePayload(userId);
let priceName = "test";

beforeAll(async () => {
    await createPrice(priceName);
});

afterAll(async () => {
    await deletePrice(priceName);
});

describe("PUT /admins/config/prices (unauthorized)", () => {
    it("missing authorization header", async () => {
        const res = await price.request(`/${priceName}`, {
            method: "PUT",
            body: JSON.stringify({ value: 1.0 }),
        });
        expect(res.status).toBe(401);
        expect(await res.json()).toEqual({
            error: "No authorization header found",
        });
    });

    it("invalid authorization header", async () => {
        const res = await price.request(`/${priceName}`, {
            method: "PUT",
            headers: { Authorization: "Bearer wrong-header" },
            body: JSON.stringify({ value: 1.0 }),
        });
        expect(res.status).toBe(401);
        expect(await res.json()).toEqual({
            error: "Invalid authorization header",
        });
    });

    it("non-admin authorization header", async () => {
        const res = await price.request(`/${priceName}`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${userPayload}` },
            body: JSON.stringify({ value: 1.0 }),
        });
        expect(res.status).toBe(403);
        expect(await res.json()).toEqual({
            error: "Forbidden",
        });
    });
});

describe("PUT /admins/config/prices (invalid requests)", () => {
    it("invalid JSON body", async () => {
        const res = await price.request(`/${priceName}`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${adminPayload}` },
            body: "invalid-json",
        });
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: "Invalid JSON" });
    });

    it("missing required fields", async () => {
        const res = await price.request(`/${priceName}`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${adminPayload}` },
            body: JSON.stringify({}),
        });
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: "Invalid JSON" });
    });

    it("price not found", async () => {
        const res = await price.request("/non-existent-price", {
            method: "PUT",
            headers: { Authorization: `Bearer ${adminPayload}` },
            body: JSON.stringify({ value: 1.0 }),
        });
        expect(res.status).toBe(404);
        expect(await res.json()).toEqual({
            error: "No price found",
        });
    });
});

describe("PUT /admins/config/prices (valid requests)", () => {
    it("should update an existing price", async () => {
        const res = await price.request(`/${priceName}`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${adminPayload}` },
            body: JSON.stringify({ value: 1.0 }),
        });
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({
            message: "Price updated successfully",
        });
    });
});