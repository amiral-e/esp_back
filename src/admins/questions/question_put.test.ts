import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import question_put from "./question_put_def.ts";
import { createQuestion, deleteQuestion } from "./utils.ts";

import { generatePayload } from "../../middlewares/utils.ts";
import config from "../../config.ts";

const adminId = config.envVars.ADMIN_ID;
const userId = config.envVars.DUMMY_ID;
let adminPayload = await generatePayload(adminId);
let userPayload = await generatePayload(userId);
let questionId = "";

beforeAll(async () => {
	questionId = await createQuestion();
});

afterAll(async () => {
	await deleteQuestion(questionId);
});

describe("PUT /admins/questions (unauthorized)", () => {
	it("missing authorization header", async () => {
		const res = await question_put.request(`/${questionId}`, {
			method: "PUT",
			body: JSON.stringify({ question: "Test question", level: "beginner" }),
		});
		expect(res.status).toBe(401);
		expect(await res.json()).toEqual({
			error: "No authorization header found",
		});
	});

	it("invalid authorization header", async () => {
		const res = await question_put.request(`/${questionId}`, {
			method: "PUT",
			headers: { Authorization: "Bearer wrong-header" },
			body: JSON.stringify({ question: "Test question", level: "beginner" }),
		});
		expect(res.status).toBe(401);
		expect(await res.json()).toEqual({
			error: "Invalid authorization header",
		});
	});

	it("non-admin authorization header", async () => {
		const res = await question_put.request(`/${questionId}`, {
			method: "PUT",
			headers: { Authorization: `Bearer ${userPayload}` },
			body: JSON.stringify({ question: "Test question", level: "beginner" }),
		});
		expect(res.status).toBe(403);
		expect(await res.json()).toEqual({
			error: "Forbidden",
		});
	});
});

describe("PUT /admins/questions (invalid requests)", () => {
	it("invalid JSON body", async () => {
		const res = await question_put.request(`/${questionId}`, {
			method: "PUT",
			headers: { Authorization: `Bearer ${adminPayload}` },
			body: "invalid-json",
		});
		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ error: "Invalid JSON" });
	});

	it("missing required fields", async () => {
		const res = await question_put.request(`/${questionId}`, {
			method: "PUT",
			headers: { Authorization: `Bearer ${adminPayload}` },
			body: JSON.stringify({}),
		});
		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ error: "Invalid JSON" });
	});

	it("question not found", async () => {
		const res = await question_put.request("/0", {
			method: "PUT",
			headers: { Authorization: `Bearer ${adminPayload}` },
			body: JSON.stringify({
				question: "Test question",
				level: "intermediate",
			}),
		});
		expect(res.status).toBe(404);
		expect(await res.json()).toEqual({
			error: "Question not found",
		});
	});

	it("invalid level", async () => {
		const res = await question_put.request(`/${questionId}`, {
			method: "PUT",
			headers: { Authorization: `Bearer ${adminPayload}` },
			body: JSON.stringify({
				question: "Test question",
				level: "invalid-level",
			}),
		});
		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ error: "Invalid level" });
	});
});

describe("PUT /admins/questions (valid requests)", () => {
	it("should update an existing question", async () => {
		const res = await question_put.request(`/${questionId}`, {
			method: "PUT",
			headers: { Authorization: `Bearer ${adminPayload}` },
			body: JSON.stringify({ question: "Test question", level: "beginner" }),
		});
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({
			message: "Question updated successfully",
		});
	});
});
