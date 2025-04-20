import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import prompts from "./prompts_get_def.ts";

import { generatePayload } from "../../middlewares/utils.ts";
import config from "../../config.ts";

const adminId = config.envVars.ADMIN_ID;
const userId = config.envVars.DUMMY_ID;
let adminPayload = await generatePayload(adminId);
let userPayload = await generatePayload(userId);

describe("GET /admins/config/prompts (unauthorized)", () => {
	it("missing authorization header", async () => {
		const res = await prompts.request("/", {
			method: "GET",
		});
		expect(res.status).toBe(401);
		expect(await res.json()).toEqual({
			error: "No authorization header found",
		});
	});

	it("invalid authorization header", async () => {
		const res = await prompts.request("/", {
			method: "GET",
			headers: { Authorization: "Bearer wrong-header" },
		});
		expect(res.status).toBe(401);
		expect(await res.json()).toEqual({
			error: "Invalid authorization header",
		});
	});

	it("non-admin authorization header", async () => {
		const res = await prompts.request("/", {
			method: "GET",
			headers: { Authorization: `Bearer ${userPayload}` },
		});
		expect(res.status).toBe(403);
		expect(await res.json()).toEqual({
			error: "Forbidden",
		});
	});
});

describe("GET /admins/config/prompts (valid requests)", () => {
	it("should return existing prompts", async () => {
		const res = await prompts.request("/", {
			method: "GET",
			headers: { Authorization: `Bearer ${adminPayload}` },
		});
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toHaveProperty("prompts");
		expect(json.prompts).toBeInstanceOf(Array);
	});
});
