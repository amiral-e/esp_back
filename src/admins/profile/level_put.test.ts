import { describe, expect, it, beforeEach, beforeAll, afterAll } from "bun:test";
import level_put from "./level_put_def.ts";
import config from "../../config.ts";
import { generatePayload } from "../../middlewares/utils.ts";

const DUMMY_ID = config.envVars.DUMMY_ID;
let adminPayload = await generatePayload(config.envVars.ADMIN_ID);
let dummyPayload = await generatePayload(config.envVars.DUMMY_ID);
const wrongPayload = await generatePayload(config.envVars.WRONG_ID);

describe("PUT /admins/profile/level (without privileges)", () => {
    it("missing authorization header", async () => {
        const res = await level_put.request(`/${DUMMY_ID}/level`, {
            method: "PUT",
            body: JSON.stringify({}),
        });
        expect(await res.json()).toEqual({
            error: "No authorization header found",
        });
        expect(res.status).toBe(401);
    });

    it("invalid authorization header", async () => {
        const res = await level_put.request(`/${DUMMY_ID}/level`, {
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
        const res = await level_put.request(`/${DUMMY_ID}/level`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${wrongPayload}` },
            body: JSON.stringify({}),
        });
        expect(await res.json()).toEqual({
            error: "Invalid user",
        });
        expect(res.status).toBe(401);
    });

    it("correct authorization header", async () => {
		const res = await level_put.request(`/${DUMMY_ID}/level`, {
			method: "PUT",
			headers: { Authorization: `Bearer ${dummyPayload}` },
		});
		expect(await res.json()).toEqual({
			error: "Forbidden",
		});
		expect(res.status).toBe(403);
	});
});

describe("PUT /admins/profile/level (with privileges)", () => {
    it("should return success when updating level", async () => {
        const res = await level_put.request(`/${DUMMY_ID}/level`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${adminPayload}` },
            body: JSON.stringify({ level: "pro" }),
        });

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({
            message: "Level updated successfully",
        });
    });

    it("should return 400 for invalid level", async () => {
        const res = await level_put.request(`/${DUMMY_ID}/level`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${adminPayload}` },
            body: new TextEncoder().encode(JSON.stringify({ level: "invalid" })),
        });

        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({
            error: "Invalid level",
        });
    });
});