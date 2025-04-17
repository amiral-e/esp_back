import { describe, expect, it, afterAll } from "bun:test";
import question_delete from "./question_delete.ts";
import { generatePayload } from "../../middlewares/utils.ts";
import config from "../../config.ts";
import { createQuestion } from "./utils.ts";

const adminId = config.envVars.ADMIN_ID;
const userId = config.envVars.DUMMY_ID;
let adminPayload = await generatePayload(adminId);
let userPayload = await generatePayload(userId);
let questionId = "";

afterAll(async () => {
    if (questionId != "Deleted") {
        await config.supabaseClient.from("questions").delete().eq("id", questionId);
    }
});

describe("DELETE /admins/questions/:question_id (unauthorized)", () => {
    it("missing authorization header", async () => {
        const res = await question_delete.request(`/0`, {
            method: "DELETE",
        });
        expect(res.status).toBe(401);
        expect(await res.json()).toEqual({
            error: "No authorization header found",
        });
    });

    it("invalid authorization header", async () => {
        const res = await question_delete.request(`/0`, {
            method: "DELETE",
            headers: { Authorization: "Bearer wrong-header" },
        });
        expect(res.status).toBe(401);
        expect(await res.json()).toEqual({
            error: "Invalid authorization header",
        });
    });

    it("non-admin authorization header", async () => {
        const res = await question_delete.request(`/0`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${userPayload}` },
        });
        expect(res.status).toBe(403);
        expect(await res.json()).toEqual({
            error: "Forbidden",
        });
    });
});

describe("DELETE /admins/questions/:question_id (invalid requests)", () => {
    it("invalid question id", async () => {
        const res = await question_delete.request("/invalid-id", {
            method: "DELETE",
            headers: { Authorization: `Bearer ${adminPayload}` },
        });
        expect(res.status).toBe(404);
        expect(await res.json()).toEqual({
            error: "Question not found",
        });
    });
});

describe("DELETE /admins/questions/:question_id (valid requests)", () => {
    it("should delete a question", async () => {
        // Create a question first
        questionId = await createQuestion();

        const res = await question_delete.request(`/${questionId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${adminPayload}` },
        });
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({
            message: "Question deleted successfully",
        });
        questionId = "Deleted";
    });
});