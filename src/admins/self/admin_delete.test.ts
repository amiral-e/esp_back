import {
	describe,
	expect,
	it,
	beforeAll,
	afterAll,
	beforeEach,
} from "bun:test";
import admin from "../index.ts";

import config from "../../config.ts";
import { insertAdmin, deleteAdmin } from "../utils.ts";
import { generatePayload } from "../../middlewares/utils.ts";

let adminPayload = await generatePayload(config.envVars.ADMIN_ID);
let dummyPayload = await generatePayload(config.envVars.DUMMY_ID);
let wrongPayload = await generatePayload(config.envVars.WRONG_ID);

afterAll(async () => {
	await deleteAdmin(config.envVars.DUMMY_ID);
});

describe("DELETE /admins (without privileges)", () => {
	it("missing authorization header", async () => {
		const res = await admin.request("/", {
			method: "DELETE",
		});
		expect(await res.json()).toEqual({
			error: "No authorization header found",
		});
		expect(res.status).toBe(401);
	});

	it("invalid authorization header", async () => {
		const res = await admin.request("/", {
			method: "DELETE",
			headers: { Authorization: `Bearer wrong-header` },
		});
		expect(await res.json()).toEqual({
			error: "Invalid authorization header",
		});
		expect(res.status).toBe(401);
	});

	it("non-user authorization header", async () => {
		const res = await admin.request("/", {
			method: "DELETE",
			headers: { Authorization: `Bearer ${wrongPayload}` },
		});
		expect(await res.json()).toEqual({
			error: "Invalid user",
		});
		expect(res.status).toBe(401);
	});

	it("correct authorization header", async () => {
		const res = await admin.request("/", {
			method: "DELETE",
			headers: { Authorization: `Bearer ${dummyPayload}` },
		});
		expect(await res.json()).toEqual({
			error: "Forbidden",
		});
		expect(res.status).toBe(403);
	});
});

describe("DELETE /admins (with privileges)", () => {
	it("invalid JSON", async () => {
		const res = await admin.request("/", {
			method: "DELETE",
			headers: { Authorization: `Bearer ${adminPayload}` },
		});
		expect(await res.json()).toEqual({
			error: "Invalid JSON",
		});
		expect(res.status).toBe(400);
	});

	it("yourself", async () => {
		const res = await admin.request("/", {
			method: "DELETE",
			headers: { Authorization: `Bearer ${adminPayload}` },
			body: JSON.stringify({ user_id: config.envVars.ADMIN_ID }),
		});
		expect(await res.json()).toEqual({
			error: "You can't remove yourself from admins",
		});
		expect(res.status).toBe(400);
	});

	it("non-user", async () => {
		const res = await admin.request("/", {
			method: "DELETE",
			headers: { Authorization: `Bearer ${adminPayload}` },
			body: JSON.stringify({ user_id: "non-user" }),
		});
		expect(await res.json()).toEqual({
			error: "User not found",
		});
		expect(res.status).toBe(404);
	});

	it("non-admin user", async () => {
		const res = await admin.request("/", {
			method: "DELETE",
			headers: { Authorization: `Bearer ${adminPayload}` },
			body: JSON.stringify({ user_id: config.envVars.DUMMY_ID }),
		});
		expect(await res.json()).toEqual({
			error: "User is not an admin",
		});
		expect(res.status).toBe(400);
	});

	it("admin user", async () => {
		await insertAdmin(config.envVars.DUMMY_ID);
		const res = await admin.request("/", {
			method: "DELETE",
			headers: { Authorization: `Bearer ${adminPayload}` },
			body: JSON.stringify({ user_id: config.envVars.DUMMY_ID }),
		});
		expect(await res.json()).toEqual({
			message: `User removed from admins`,
		});
		expect(res.status).toBe(200);
	});
});
