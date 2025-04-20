// src/admins/config/prices_get.test.ts
import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import prices from "./prices_get_def.ts";
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

describe("GET /admins/config/prices (unauthorized)", () => {
	it("missing authorization header", async () => {
		const res = await prices.request("/", {
			method: "GET",
		});
		expect(res.status).toBe(401);
		expect(await res.json()).toEqual({
			error: "No authorization header found",
		});
	});

	it("invalid authorization header", async () => {
		const res = await prices.request("/", {
			method: "GET",
			headers: { Authorization: "Bearer wrong-header" },
		});
		expect(res.status).toBe(401);
		expect(await res.json()).toEqual({
			error: "Invalid authorization header",
		});
	});

	it("non-admin authorization header", async () => {
		const res = await prices.request("/", {
			method: "GET",
			headers: { Authorization: `Bearer ${userPayload}` },
		});
		expect(res.status).toBe(403);
		expect(await res.json()).toEqual({
			error: "Forbidden",
		});
	});
});

describe("GET /admins/config/prices (valid requests)", () => {
	it("should return existing prices", async () => {
		const res = await prices.request("/", {
			method: "GET",
			headers: { Authorization: `Bearer ${adminPayload}` },
		});
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toHaveProperty("prices");
		expect(json.prices).toBeInstanceOf(Array);
	});
});
