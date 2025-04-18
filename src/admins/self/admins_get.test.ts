import {
	describe,
	expect,
	it,
	beforeAll,
	afterAll,
	beforeEach,
} from "bun:test";
import admins from "../index.ts";
import config from "../../config.ts";
import { insertAdmin, deleteAdmin } from "../utils.ts";
import { generatePayload } from "../../middlewares/utils.ts";

let adminPayload = await generatePayload(config.envVars.ADMIN_ID);
let dummyPayload = await generatePayload(config.envVars.DUMMY_ID);
let wrongPayload = await generatePayload(config.envVars.WRONG_ID);

afterAll(async () => {
	await deleteAdmin(config.envVars.DUMMY_ID);
});

describe("GET /admins (without privileges)", () => {
	it("missing authorization header", async () => {
		const res = await admins.request("/", {
			method: "GET",
		});
		expect(await res.json()).toEqual({
			error: "No authorization header found",
		});
		expect(res.status).toBe(401);
	});

	it("invalid authorization header", async () => {
		const res = await admins.request("/", {
			method: "GET",
			headers: { Authorization: `Bearer wrong-header` },
		});
		expect(await res.json()).toEqual({
			error: "Invalid authorization header",
		});
		expect(res.status).toBe(401);
	});

	it("non-user authorization header", async () => {
		const res = await admins.request("/", {
			method: "GET",
			headers: { Authorization: `Bearer ${wrongPayload}` },
		});
		expect(await res.json()).toEqual({
			error: "Invalid user",
		});
		expect(res.status).toBe(401);
	});

	it("correct authorization header but no admin privileges", async () => {
		const res = await admins.request("/", {
			method: "GET",
			headers: { Authorization: `Bearer ${dummyPayload}` },
		});
		expect(await res.json()).toEqual({
			error: "Forbidden",
		});
		expect(res.status).toBe(403);
	});
});

describe("GET /admins (with privileges)", () => {
	it("successful request", async () => {
		await insertAdmin(config.envVars.DUMMY_ID);

		const res = await admins.request("/", {
			method: "GET",
			headers: { Authorization: `Bearer ${adminPayload}` },
		});
		expect(res.status).toBe(200);
		expect(await res.json()).toHaveProperty("admins");
	});
});