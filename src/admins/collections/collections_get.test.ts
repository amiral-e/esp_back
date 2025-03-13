import { describe, expect, it, afterAll } from "bun:test";
import collections_get from "./collections_get.ts";
import config from "../../config.ts";
import { generatePayload } from "../../middlewares/utils.ts";
import { createGlobalCollection, deleteGlobalCollection} from "./utils.ts"

let adminPayload = await generatePayload(config.envVars.ADMIN_ID);
let dummyPayload = await generatePayload(config.envVars.DUMMY_ID);
let wrongPayload = await generatePayload(config.envVars.WRONG_ID);

afterAll(async () => {
    await deleteGlobalCollection(config.envVars.ADMIN_ID, "global_1");
    await deleteGlobalCollection(config.envVars.ADMIN_ID, "global_2");
});

describe("GET /admins/collections (without privileges)", () => {
    it("missing authorization header", async () => {
        const res = await collections_get.request("/");
        expect(await res.json()).toEqual({
            error: "No authorization header found",
        });
        expect(res.status).toBe(401);
    });

    it("invalid authorization header", async () => {
        const res = await collections_get.request("/", {
            headers: { Authorization: `Bearer wrong-header` },
        });
        expect(await res.json()).toEqual({
            error: "Invalid authorization header",
        });
        expect(res.status).toBe(401);
    });

    it("non-user authorization header", async () => {
        const res = await collections_get.request("/", {
            headers: { Authorization: `Bearer ${wrongPayload}` },
        });
        expect(await res.json()).toEqual({
            error: "Invalid user",
        });
        expect(res.status).toBe(401);
    });
});

describe("GET /admins/collections (with privileges)", () => {
    it("successful response", async () => {
        await createGlobalCollection(config.envVars.ADMIN_ID, "global_1");
        await createGlobalCollection(config.envVars.ADMIN_ID, "global_2");

        const res = await collections_get.request("/", {
            headers: { Authorization: `Bearer ${adminPayload}` },
        });
        const body = await res.json();
        expect(body).toHaveProperty("collections");
        expect(body.collections).toBeInstanceOf(Array);
        expect(res.status).toBe(200);
    }, 10000);
});