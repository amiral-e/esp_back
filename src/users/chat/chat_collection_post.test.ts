import {
	describe,
	expect,
	it,
	beforeAll,
	afterAll,
} from "bun:test";
import chat_collection_post from "./chat_collection_post_def.ts";

import {
	createConversation,
	deleteConversation,
} from "../conversations/utils.ts";
import { createCollection } from "../collections/utils.ts";

import config from "../../config.ts";
import { generatePayload } from "../../middlewares/utils.ts";

const userId = config.envVars.DUMMY_ID;
let dummyPayload = await generatePayload(userId);
let wrongPayload = await generatePayload(config.envVars.WRONG_ID);

let convId = "";
const collecName = userId + "_test_collec";

beforeAll(async () => {
	convId = await createConversation(userId, "test_conv");
});

afterAll(async () => {
	await deleteConversation(userId, convId);
});

describe("POST /conversations/:conv_id/collections/:collec_name (unauthorized)", () => {
	it("missing authorization header", async () => {
		const res = await chat_collection_post.request(`/${convId}/collections`, {
			method: "POST",
			body: JSON.stringify({ message: "test", collections: [collecName] }),
		});
		expect(await res.json()).toEqual({
			error: "No authorization header found",
		});
		expect(res.status).toBe(401);
	});

	it("invalid authorization header", async () => {
		const res = await chat_collection_post.request(`/${convId}/collections`, {
			method: "POST",
			headers: { Authorization: `Bearer wrong-header` },
			body: JSON.stringify({ message: "test", collections: [collecName] }),
		});
		expect(await res.json()).toEqual({
			error: "Invalid authorization header",
		});
		expect(res.status).toBe(401);
	});

	it("non-user authorization header", async () => {
		const res = await chat_collection_post.request(`/${convId}/collections`, {
			method: "POST",
			headers: { Authorization: `Bearer ${wrongPayload}` },
			body: JSON.stringify({ message: "test", collections: [collecName] }),
		});
		expect(await res.json()).toEqual({
			error: "Invalid user",
		});
		expect(res.status).toBe(401);
	});
});

describe("POST /conversations/:conv_id/collections/:collec_name (authorized)", () => {
	it("invalid JSON", async () => {
		const res = await chat_collection_post.request(`/${convId}/collections`, {
			method: "POST",
			headers: { Authorization: `Bearer ${dummyPayload}` },
		});
		expect(await res.json()).toEqual({
			error: "Invalid JSON",
		});
		expect(res.status).toBe(400);
	});

	it("empty message", async () => {
		const res = await chat_collection_post.request(`/${convId}/collections`, {
			method: "POST",
			headers: { Authorization: `Bearer ${dummyPayload}` },
			body: JSON.stringify({ message: "", collections: [collecName] }),
		});
		expect(await res.json()).toEqual({
			error: "Invalid JSON",
		});
		expect(res.status).toBe(400);
	});

	it("invalid collection name", async () => {
		const res = await chat_collection_post.request(`/${convId}/collections`, {
			method: "POST",
			headers: { Authorization: `Bearer ${dummyPayload}` },
			body: JSON.stringify({ message: "test", collections: ["invalid_name"] }),
		});
		expect(await res.json()).toEqual({
			error: "Invalid collection name",
		});
		expect(res.status).toBe(400);
	});

	it("conversation not found", async () => {
		const res = await chat_collection_post.request(
			`/invalid_conv_id/collections`,
			{
				method: "POST",
				headers: { Authorization: `Bearer ${dummyPayload}` },
				body: JSON.stringify({ message: "test", collections: [collecName] }),
			},
		);
		expect(await res.json()).toEqual({
			error: "Conversation not found",
		});
		expect(res.status).toBe(404);
	});

	it("successful post", async () => {
		await createCollection(userId, collecName);

		const res = await chat_collection_post.request(`/${convId}/collections`, {
			method: "POST",
			headers: { Authorization: `Bearer ${dummyPayload}` },
			body: JSON.stringify({ message: "test", collections: [collecName] }),
		});
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toHaveProperty("role");
		expect(body).toHaveProperty("content");
		expect(body).toHaveProperty("sources");
	}, 10000);
});
