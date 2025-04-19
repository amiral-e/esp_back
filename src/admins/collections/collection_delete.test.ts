import { describe, expect, it } from "bun:test";
import collection_delete from "./collection_delete_def.ts";
import config from "../../config.ts";
import { generatePayload } from "../../middlewares/utils.ts";
import { createGlobalCollection } from "./utils.ts";

let adminPayload = await generatePayload(config.envVars.ADMIN_ID);
let dummyPayload = await generatePayload(config.envVars.DUMMY_ID);
let wrongPayload = await generatePayload(config.envVars.WRONG_ID);

describe("DELETE /admins/collections/:collection_name (without privileges)", () => {
	it("missing authorization header", async () => {
		const res = await collection_delete.request("/test_1", {
			method: "DELETE",
		});
		expect(await res.json()).toEqual({
			error: "No authorization header found",
		});
		expect(res.status).toBe(401);
	});

	it("invalid authorization header", async () => {
		const res = await collection_delete.request("/test_1", {
			method: "DELETE",
			headers: { Authorization: `Bearer wrong-header` },
		});
		expect(await res.json()).toEqual({
			error: "Invalid authorization header",
		});
		expect(res.status).toBe(401);
	});

	it("non-user authorization header", async () => {
		const res = await collection_delete.request("/test", {
			method: "DELETE",
			headers: { Authorization: `Bearer ${wrongPayload}` },
		});
		expect(await res.json()).toEqual({
			error: "Invalid user",
		});
		expect(res.status).toBe(401);
	});

	it("non-admin authorization header", async () => {
		const res = await collection_delete.request("/test", {
			method: "DELETE",
			headers: { Authorization: `Bearer ${dummyPayload}` },
		});
		expect(await res.json()).toEqual({
			error: "Forbidden",
		});
		expect(res.status).toBe(403);
	});
});

describe("DELETE /admins/collections/:collection_name (with privileges)", () => {
	it("delete non-existent collection", async () => {
		const res = await collection_delete.request("/test_2", {
			method: "DELETE",
			headers: { Authorization: `Bearer ${adminPayload}` },
		});
		expect(await res.json()).toEqual({
			error: "Collection not found",
		});
		expect(res.status).toBe(404);
	});

	it("successful deletion", async () => {
		await createGlobalCollection(config.envVars.ADMIN_ID, "global_test_1");

		const res = await collection_delete.request("/test_1", {
			method: "DELETE",
			headers: { Authorization: `Bearer ${adminPayload}` },
		});
		expect(await res.json()).toEqual({
			message: "Collection deleted successfully",
		});
		expect(res.status).toBe(200);
	});
});
