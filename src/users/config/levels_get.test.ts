import { describe, expect, it } from "bun:test";
import levels_get from "./levels_get_def.ts";
import { generatePayload } from "../../middlewares/utils.ts";
import config from "../../config.ts";

const userId = config.envVars.DUMMY_ID;
let userPayload = await generatePayload(userId);

describe("GET /users/config/levels", () => {
    it("should return levels with valid authentication", async () => {
        const res = await levels_get.request("/", {
            method: "GET",
            headers: { Authorization: `Bearer ${userPayload}` },
        });
        expect(res.status).toBe(200);
        expect(await res.json()).toHaveProperty("levels");
    });

    it("should return an error with invalid authentication", async () => {
        const res = await levels_get.request("/", {
            method: "GET",
            headers: { Authorization: "Bearer invalid-token" },
        });
        expect(res.status).toBe(401);
        expect(await res.json()).toHaveProperty("error");
    });

    it("should return an error with missing authentication", async () => {
        const res = await levels_get.request("/", { method: "GET" });
        expect(res.status).toBe(401);
        expect(await res.json()).toHaveProperty("error");
    });
});