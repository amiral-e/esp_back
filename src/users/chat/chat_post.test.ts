import {
	describe,
	expect,
	it,
	beforeEach,
	beforeAll,
	afterAll,
} from "bun:test";
import chat_post from "./chat_post.ts";

import envVars from "../../config.ts";

import {
	createConversation,
	deleteConversation,
} from "../conversations/utils.ts";

var convId = "";

beforeAll(async () => {
	convId = await createConversation(envVars.DUMMY_ID, "test_conv");
});

afterAll(async () => {
	await deleteConversation(envVars.DUMMY_ID, convId);
});

describe("POST /conversations/:conv_id (unauthorized)", () => {
	it("missing authorization header", async () => {
		const res = await chat_post.request(`/${convId}`, {
			method: "POST",
			body: JSON.stringify({ message: "test" }),
		});
		expect(await res.json()).toEqual({
			error: "No authorization header found",
		});
		expect(res.status).toBe(401);
	});

	it("invalid authorization header", async () => {
		const res = await chat_post.request(`/${convId}`, {
			method: "POST",
			headers: { Authorization: `Bearer wrong-header` },
			body: JSON.stringify({ message: "test" }),
		});
		expect(await res.json()).toEqual({
			error: "Invalid authorization header",
		});
		expect(res.status).toBe(401);
	});

	it("non-user authorization header", async () => {
		const res = await chat_post.request(`/${convId}`, {
			method: "POST",
			headers: { Authorization: `Bearer ${envVars.WRONG_JWT_PAYLOAD}` },
			body: JSON.stringify({ message: "test" }),
		});
		expect(await res.json()).toEqual({
			error: "Invalid user",
		});
		expect(res.status).toBe(401);
	});
});

describe("POST /conversations/:conv_id (authorized)", () => {
	it("invalid JSON", async () => {
		const res = await chat_post.request(`/${convId}`, {
			method: "POST",
			headers: { Authorization: `Bearer ${envVars.DUMMY_JWT_PAYLOAD}` },
		});
		expect(await res.json()).toEqual({
			error: "Invalid JSON",
		});
		expect(res.status).toBe(400);
	});

	it("empty message", async () => {
		const res = await chat_post.request(`/${convId}`, {
			method: "POST",
			headers: { Authorization: `Bearer ${envVars.DUMMY_JWT_PAYLOAD}` },
			body: JSON.stringify({ message: "" }),
		});
		const body = await res.json();
		expect(body).toContainKeys(["content", "role"]);
		expect(body.role).toBe("assistant");
		expect(res.status).toBe(200);
	});

	it("conversation not found", async () => {
		const res = await chat_post.request(`/invalid_conv_id`, {
			method: "POST",
			headers: { Authorization: `Bearer ${envVars.DUMMY_JWT_PAYLOAD}` },
			body: JSON.stringify({ message: "test" }),
		});
		expect(await res.json()).toEqual({
			error: "Conversation not found",
		});
		expect(res.status).toBe(404);
	});

	it("successful post", async () => {
		const res = await chat_post.request(`/${convId}`, {
			method: "POST",
			headers: { Authorization: `Bearer ${envVars.DUMMY_JWT_PAYLOAD}` },
			body: JSON.stringify({ message: "test" }),
		});
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toHaveProperty("role");
		expect(body).toHaveProperty("content");
	});
});
