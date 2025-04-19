import { describe, expect, it, afterAll } from "bun:test";
import question_post from "./question_post_def.ts";
import { generatePayload } from "../../middlewares/utils.ts";

import config from "../../config.ts";
import { deleteQuestion } from "./utils.ts";

const adminId = config.envVars.ADMIN_ID;
const userId = config.envVars.DUMMY_ID;
let adminPayload = await generatePayload(adminId);
let userPayload = await generatePayload(userId);
let questionId = "";

afterAll(async () => {
    await deleteQuestion(questionId);
});

describe("POST /admins/questions (unauthorized)", () => {
    it("missing authorization header", async () => {
        const res = await question_post.request("/", {
        method: "POST",
        body: JSON.stringify({ question: "Test question", level: "beginner" }),
        });
        expect(res.status).toBe(401);
        expect(await res.json()).toEqual({
        error: "No authorization header found",
        });
    });

    it("invalid authorization header", async () => {
        const res = await question_post.request("/", {
        method: "POST",
        headers: { Authorization: "Bearer wrong-header" },
        body: JSON.stringify({ question: "Test question", level: "beginner" }),
        });
        expect(res.status).toBe(401);
        expect(await res.json()).toEqual({
        error: "Invalid authorization header",
        });
    });

    it("non-admin authorization header", async () => {
        const res = await question_post.request("/", {
        method: "POST",
        headers: { Authorization: `Bearer ${userPayload}` },
        body: JSON.stringify({ question: "Test question", level: "beginner" }),
        });
        expect(res.status).toBe(403);
        expect(await res.json()).toEqual({
        error: "Forbidden",
        });
    });
});

describe("POST /admins/questions (invalid requests)", () => {
    it("invalid JSON body", async () => {
        const res = await question_post.request("/", {
        method: "POST",
        headers: { Authorization: `Bearer ${adminPayload}` },
        body: "invalid-json",
        });
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: "Invalid JSON" });
    });

    it("missing required fields", async () => {
        const res = await question_post.request("/", {
        method: "POST",
        headers: { Authorization: `Bearer ${adminPayload}` },
        body: JSON.stringify({}),
        });
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: "Invalid JSON" });
    });

    it("invalid level", async () => {
        const res = await question_post.request("/", {
        method: "POST",
        headers: { Authorization: `Bearer ${adminPayload}` },
        body: JSON.stringify({ question: "Test question", level: "invalid-level" }),
        });
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: "Invalid level" });
    });
});

describe("POST /admins/questions (valid requests)", () => {
    it("should add a new question", async () => {
        const res = await question_post.request("/", {
            method: "POST",
            headers: { Authorization: `Bearer ${adminPayload}` },
            body: JSON.stringify({ question: "Test question", level: "beginner" }),
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        questionId = json.id;
        expect(json).toEqual({
            message: "Question added successfully",
            id: expect.any(Number),
        });
    });
});