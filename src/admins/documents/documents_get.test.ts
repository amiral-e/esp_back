import { describe, expect, it, afterAll } from "bun:test";
import documents_get from "./documents_get_def.ts";

import config from "../../config.ts";
import { generatePayload } from "../../middlewares/utils.ts";
import {
	createGlobalCollection,
	deleteGlobalCollection,
} from "../collections/utils.ts";

let adminPayload = await generatePayload(config.envVars.ADMIN_ID);
let wrongPayload = await generatePayload(config.envVars.WRONG_ID);

afterAll(async () => {
	// Nettoyer la collection de test
	await deleteGlobalCollection(config.envVars.ADMIN_ID, "global_test_collec");
});

describe("GET /admins/documents (unauthorized)", () => {
	it("missing authorization header", async () => {
		const res = await documents_get.request(`/test_collec/documents`, {
			method: "GET",
		});
		expect(await res.json()).toEqual({
			error: "No authorization header found",
		});
		expect(res.status).toBe(401);
	});

	it("invalid authorization header", async () => {
		const res = await documents_get.request(`/test_collec/documents`, {
			method: "GET",
			headers: { Authorization: `Bearer wrong-header` },
		});
		expect(await res.json()).toEqual({
			error: "Invalid authorization header",
		});
		expect(res.status).toBe(401);
	});

	it("non-user authorization header", async () => {
		const res = await documents_get.request(`/test_collec/documents`, {
			method: "GET",
			headers: { Authorization: `Bearer ${wrongPayload}` },
		});
		expect(await res.json()).toEqual({
			error: "Invalid user",
		});
		expect(res.status).toBe(401);
	});
});

describe("GET /admins/documents (authorized)", () => {
	it("should return 404 when no documents found", async () => {
		const res = await documents_get.request(
			`/nonexistent_collection/documents`,
			{
				method: "GET",
				headers: { Authorization: `Bearer ${adminPayload}` },
			},
		);

		expect(res.status).toBe(404);
		expect(await res.json()).toEqual({
			error: "Collection not found",
		});
	});

	it("should return documents for global collection", async () => {
		await createGlobalCollection(config.envVars.ADMIN_ID, "global_test_collec");

		const res = await documents_get.request(`/test_collec/documents`, {
			method: "GET",
			headers: { Authorization: `Bearer ${adminPayload}` },
		});
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toHaveProperty("documents");
		expect(body.documents).toBeInstanceOf(Array);
	});
});
