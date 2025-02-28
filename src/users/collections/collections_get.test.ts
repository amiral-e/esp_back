import {
	describe,
	expect,
	it,
	beforeEach,
	beforeAll,
	afterAll,
} from "bun:test";
import collections from "./collections_get.ts";
import { createCollection, deleteCollection } from "./utils.ts";

import config from "../../config.ts";
import { generatePayload } from "../../middlewares/utils.ts";

const userId = config.envVars.DUMMY_ID;
let dummyPayload = await generatePayload(userId);
let wrongPayload = await generatePayload(config.envVars.WRONG_ID);
var collectionName = `${userId}_test_collection`;

afterAll(async () => {
	// Nettoyer la collection de test
	await deleteCollection(collectionName);
});

describe("GET /users/collections (unauthorized)", () => {
	it("missing authorization header", async () => {
		const res = await collections.request("/", {
			method: "GET",
		});
		expect(await res.json()).toEqual({
			error: "No authorization header found",
		});
		expect(res.status).toBe(401);
	});

	it("invalid authorization header", async () => {
		const res = await collections.request("/", {
			method: "GET",
			headers: { Authorization: `Bearer wrong-header` },
		});
		expect(await res.json()).toEqual({
			error: "Invalid authorization header",
		});
		expect(res.status).toBe(401);
	});

	it("non-user authorization header", async () => {
		const res = await collections.request("/", {
			method: "GET",
			headers: { Authorization: `Bearer ${wrongPayload}` },
		});
		expect(await res.json()).toEqual({
			error: "Invalid user",
		});
		expect(res.status).toBe(401);
	});
});

describe("GET /users/collections (authorized)", () => {
	it("should return 404 when no collections found", async () => {
		const res = await collections.request("/", {
			method: "GET",
			headers: { Authorization: `Bearer ${dummyPayload}` },
		});

		expect(res.status).toBe(404);
		expect(await res.json()).toEqual({
			error: "No collections found",
		});
	});

	it("should return collections for user", async () => {
		await createCollection(userId, collectionName);

		const res = await collections.request("/", {
			method: "GET",
			headers: { Authorization: `Bearer ${dummyPayload}` },
		});
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toHaveProperty("collections");
		expect(body.collections).toBeInstanceOf(Array);
	});
});