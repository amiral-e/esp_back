import { describe, expect, it, beforeEach, beforeAll, afterAll } from "bun:test";
import level_put from "./level_put.ts";
import config from "../../config.ts";
import { generatePayload } from "../../middlewares/utils.ts";

const userId = config.envVars.DUMMY_ID;
let dummyPayload = await generatePayload(userId);
const wrongPayload = await generatePayload(config.envVars.WRONG_ID);

describe("PUT /users/profile/level (unauthorized)", () => {
    it("missing authorization header", async () => {
        const res = await level_put.request("/", {
            method: "PUT",
            body: JSON.stringify({}),
        });
        expect(await res.json()).toEqual({
            error: "No authorization header found",
        });
        expect(res.status).toBe(401);
    });

    it("invalid authorization header", async () => {
        const res = await level_put.request("/", {
            method: "PUT",
            headers: { Authorization: `Bearer wrong-header` },
            body: JSON.stringify({}),
        });
        expect(await res.json()).toEqual({
            error: "Invalid authorization header",
        });
        expect(res.status).toBe(401);
    });

    it("non-user authorization header", async () => {
        const res = await level_put.request("/", {
            method: "PUT",
            headers: { Authorization: `Bearer ${wrongPayload}` },
            body: JSON.stringify({}),
        });
        expect(await res.json()).toEqual({
            error: "Invalid user",
        });
        expect(res.status).toBe(401);
    });
});

describe("PUT /users/profile/level (authorized)", () => {
    it("should return success when updating level", async () => {
        const res = await level_put.request("/", {
            method: "PUT",
            headers: { Authorization: `Bearer ${dummyPayload}` },
            body: JSON.stringify({ level: "pro" }),
        });

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({
            message: "Level updated successfully",
        });
    });

    it("should return 400 for invalid level", async () => {
        const res = await level_put.request("/", {
            method: "PUT",
            headers: { Authorization: `Bearer ${dummyPayload}` },
            body: new TextEncoder().encode(JSON.stringify({ level: "invalid" })),
        });

        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({
            error: "Invalid level",
        });
    });
});