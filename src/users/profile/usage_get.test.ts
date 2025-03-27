import { describe, expect, it, beforeEach, beforeAll, afterAll } from "bun:test";
import usage_get from "./usage_get.ts";
import config from "../../config.ts";
import { generatePayload } from "../../middlewares/utils.ts";

const userId = config.envVars.DUMMY_ID;
let dummyPayload = await generatePayload(userId);
let wrongPayload = await generatePayload(config.envVars.WRONG_ID);

describe("GET /users/profile/usage (unauthorized)", () => {
    it("missing authorization header", async () => {
        const res = await usage_get.request("/", {
            method: "GET",
        });
        expect(await res.json()).toEqual({
            error: "No authorization header found",
        });
        expect(res.status).toBe(401);
    });

    it("invalid authorization header", async () => {
        const res = await usage_get.request("/", {
            method: "GET",
            headers: { Authorization: `Bearer wrong-header` },
        });
        expect(await res.json()).toEqual({
            error: "Invalid authorization header",
        });
        expect(res.status).toBe(401);
    });

    it("non-user authorization header", async () => {
        const res = await usage_get.request("/", {
            method: "GET",
            headers: { Authorization: `Bearer ${wrongPayload}` },
        });
        expect(await res.json()).toEqual({
            error: "Invalid user",
        });
        expect(res.status).toBe(401);
    });
});

describe("GET /users/profile/usage (authorized)", () => {
    it("should return usage details for user", async () => {
        const res = await usage_get.request("/", {
            method: "GET",
            headers: { Authorization: `Bearer ${dummyPayload}` },
        });

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty("usage");
        expect(body.usage).toBeArray();
        expect(body.usage[0]).toContainAllKeys(["month", "used_credits", "total_messages", "total_docs", "total_reports"]);
    });
});