import {
	describe,
	expect,
	it,
	beforeAll,
	afterAll,
	beforeEach,
} from "bun:test";
import admin from "../index.ts";

import envVars from "../../config_test.ts";

import { insertAdmin, deleteAdmin } from "../utils.ts";

afterAll(async () => {
	await deleteAdmin(envVars.DUMMY_ID);
	await deleteAdmin(envVars.DUMMY_ID_2);
});

describe("DELETE /admins (without privileges)", () => {
	beforeEach(async () => {
		await deleteAdmin(envVars.DUMMY_ID);
	});

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
			headers: { Authorization: `Bearer ${envVars.WRONG_JWT_PAYLOAD}` },
		});
		expect(await res.json()).toEqual({
			error: "Uid not found",
		});
		expect(res.status).toBe(404);
	});

	it("correct authorization header", async () => {
		const res = await admin.request("/", {
			method: "DELETE",
			headers: { Authorization: `Bearer ${envVars.DUMMY_JWT_PAYLOAD}` },
		});
		expect(await res.json()).toEqual({
			error: "You don't have admin privileges",
		});
		expect(res.status).toBe(401);
	});
});

describe("DELETE /admins (with privileges)", () => {
	beforeEach(async () => {
		await insertAdmin(envVars.DUMMY_ID);
	});

	it("invalid JSON", async () => {
		const res = await admin.request("/", {
			method: "DELETE",
			headers: { Authorization: `Bearer ${envVars.DUMMY_JWT_PAYLOAD}` },
		});
		expect(await res.json()).toEqual({
			error: "Invalid JSON",
		});
		expect(res.status).toBe(400);
	});

	it("yourself", async () => {
		const res = await admin.request("/", {
			method: "DELETE",
			headers: { Authorization: `Bearer ${envVars.DUMMY_JWT_PAYLOAD}` },
			body: JSON.stringify({ user_id: envVars.DUMMY_ID }),
		});
		expect(await res.json()).toEqual({
			error: "You can't remove yourself from admins",
		});
		expect(res.status).toBe(400);
	});

	it("non-user", async () => {
		const res = await admin.request("/", {
			method: "DELETE",
			headers: { Authorization: `Bearer ${envVars.DUMMY_JWT_PAYLOAD}` },
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
			headers: { Authorization: `Bearer ${envVars.DUMMY_JWT_PAYLOAD}` },
			body: JSON.stringify({ user_id: envVars.DUMMY_ID_2 }),
		});
		expect(await res.json()).toEqual({
			error: "User is not an admin",
		});
		expect(res.status).toBe(400);
	});

	it("admin user", async () => {
		await insertAdmin(envVars.DUMMY_ID_2);
		const res = await admin.request("/", {
			method: "DELETE",
			headers: { Authorization: `Bearer ${envVars.DUMMY_JWT_PAYLOAD}` },
			body: JSON.stringify({ user_id: envVars.DUMMY_ID_2 }),
		});
		expect(await res.json()).toEqual({
			message: `User ${envVars.DUMMY_ID_2} removed from admins`,
		});
		expect(res.status).toBe(200);
	});
});
