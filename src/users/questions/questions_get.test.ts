import { describe, expect, it } from "bun:test";
import questions_get from "./questions_get.ts";
import { generatePayload } from "../../middlewares/utils.ts";
import config from "../../config.ts";

const userId = config.envVars.DUMMY_ID;
let userPayload = await generatePayload(userId);

describe("GET /admins/questions", () => {
    it("should return questions with valid admin authentication", async () => {
        const res = await questions_get.request("/", {
            method: "GET",
            headers: { Authorization: `Bearer ${userPayload}` },
        });
        expect(res.status).toBe(200);
        expect(await res.json()).toHaveProperty("questions");
    });

    it("should return an error with invalid admin authentication", async () => {
        const res = await questions_get.request("/", {
            method: "GET",
            headers: { Authorization: "Bearer invalid-token" },
        });
        expect(res.status).toBe(401);
        expect(await res.json()).toHaveProperty("error");
    });

    it("should return an error with missing admin authentication", async () => {
        const res = await questions_get.request("/", { method: "GET" });
        expect(res.status).toBe(401);
        expect(await res.json()).toHaveProperty("error");
    });
});