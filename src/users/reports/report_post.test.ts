// src/users/reports/report_post.test.ts
import { describe, expect, it, afterAll } from "bun:test";
import report_post from "./report_post.ts";
import { generatePayload } from "../../middlewares/utils.ts";

import config from "../../config.ts";
import { deleteReport } from "./utils.ts";

const userId = config.envVars.DUMMY_ID;
let userPayload = await generatePayload(userId);
let reportId = "";

afterAll(async () => {
    await deleteReport(reportId);
});

describe("POST /users/reports (unauthorized)", () => {
    it("missing authorization header", async () => {
        const res = await report_post.request("/", {
            method: "POST",
            body: JSON.stringify({
                title: "Test report",
                documents: ["doc1", "doc2"],
                prompt: "Test prompt",
                collection_name: "test-collection",
            }),
        });
        expect(res.status).toBe(401);
        expect(await res.json()).toEqual({
            error: "No authorization header found",
        });
    });

    it("invalid authorization header", async () => {
        const res = await report_post.request("/", {
            method: "POST",
            headers: { Authorization: "Bearer wrong-header" },
            body: JSON.stringify({
                title: "Test report",
                documents: ["doc1", "doc2"],
                prompt: "Test prompt",
                collection_name: "test-collection",
            }),
        });
        expect(res.status).toBe(401);
        expect(await res.json()).toEqual({
            error: "Invalid authorization header",
        });
    });
});

describe("POST /users/reports (invalid requests)", () => {
    it("invalid JSON body", async () => {
        const res = await report_post.request("/", {
            method: "POST",
            headers: { Authorization: `Bearer ${userPayload}` },
            body: "invalid-json",
            });
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: "Invalid JSON" });
    });

    it("missing required fields", async () => {
        const res = await report_post.request("/", {
            method: "POST",
            headers: { Authorization: `Bearer ${userPayload}` },
            body: JSON.stringify({}),
        });
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: "Invalid JSON" });
    });
});

describe("POST /users/reports (valid requests)", () => {
    it("should generate a report", async () => {
        const res = await report_post.request("/", {
            method: "POST",
            headers: { Authorization: `Bearer ${userPayload}` },
            body: JSON.stringify({
                title: "Test report",
                documents: ["doc1", "doc2"],
                prompt: "Génère rapport sur ma fiche de paie",
                collection_name: "test-collection",
            }),
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        reportId = json.id;
        expect(json).toHaveProperty("title", "Test report");
        expect(json).toHaveProperty("text");
    });
});