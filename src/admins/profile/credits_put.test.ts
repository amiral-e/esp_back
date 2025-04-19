import { describe, expect, it, beforeEach, beforeAll, afterAll } from "bun:test";
import credits_put from "./credits_put_def.ts";
import config from "../../config.ts";
import { generatePayload } from "../../middlewares/utils.ts";

const DUMMY_ID = config.envVars.DUMMY_ID;
let adminPayload = await generatePayload(config.envVars.ADMIN_ID);
let dummyPayload = await generatePayload(config.envVars.DUMMY_ID);
const wrongPayload = await generatePayload(config.envVars.WRONG_ID);

describe("PUT /:user_id/grant (without privileges)", () => {
    it("missing authorization header", async () => {
        const res = await credits_put.request(`/${DUMMY_ID}/grant`, {
            method: "PUT",
            body: JSON.stringify({ credits: 100 }),
        });
        expect(await res.json()).toEqual({
            error: "No authorization header found",
        });
        expect(res.status).toBe(401);
    });

    it("invalid authorization header", async () => {
        const res = await credits_put.request(`/${DUMMY_ID}/grant`, {
            method: "PUT",
            headers: { Authorization: `Bearer wrong-header` },
            body: JSON.stringify({ credits: 100 }),
        });
        expect(await res.json()).toEqual({
            error: "Invalid authorization header",
        });
        expect(res.status).toBe(401);
    });

    it("non-user authorization header", async () => {
        const res = await credits_put.request(`/${DUMMY_ID}/grant`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${wrongPayload}` },
            body: JSON.stringify({ credits: 100 }),
        });
        expect(await res.json()).toEqual({
            error: "Invalid user",
        });
        expect(res.status).toBe(401);
    });

    it("correct authorization header", async () => {
        const res = await credits_put.request(`/${DUMMY_ID}/grant`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${dummyPayload}` },
        });
        expect(await res.json()).toEqual({
            error: "Forbidden",
        });
        expect(res.status).toBe(403);
    });
});

describe("PUT /:user_id/grant (with privileges)", () => {
    it("should return success when updating credits", async () => {
        const res = await credits_put.request(`/${DUMMY_ID}/grant`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${adminPayload}` },
            body: JSON.stringify({ credits: 100 }),
        });

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({
            message: "Credits updated successfully",
        });
    });

    it("should return 500 for invalid credits", async () => {
        const res = await credits_put.request(`/${DUMMY_ID}/grant`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${adminPayload}` },
            body: JSON.stringify({ credits: "invalid" }),
        });

        expect(res.status).toBe(500);
        expect(await res.json()).toEqual({
            error: "Invalid credits format",
        });
    });
});