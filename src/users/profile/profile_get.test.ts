import {
	describe,
	expect,
	it,
	beforeEach,
	beforeAll,
	afterAll,
} from "bun:test";
import profile_get from "./profile_get_def.ts";
import config from "../../config.ts";
import { generatePayload } from "../../middlewares/utils.ts";

const userId = config.envVars.DUMMY_ID;
let dummyPayload = await generatePayload(userId);
let wrongPayload = await generatePayload(config.envVars.WRONG_ID);

describe("GET /users/profile (unauthorized)", () => {
	it("missing authorization header", async () => {
		const res = await profile_get.request("/", {
			method: "GET",
		});
		expect(await res.json()).toEqual({
			error: "No authorization header found",
		});
		expect(res.status).toBe(401);
	});

	it("invalid authorization header", async () => {
		const res = await profile_get.request("/", {
			method: "GET",
			headers: { Authorization: `Bearer wrong-header` },
		});
		expect(await res.json()).toEqual({
			error: "Invalid authorization header",
		});
		expect(res.status).toBe(401);
	});

	it("non-user authorization header", async () => {
		const res = await profile_get.request("/", {
			method: "GET",
			headers: { Authorization: `Bearer ${wrongPayload}` },
		});
		expect(await res.json()).toEqual({
			error: "Invalid user",
		});
		expect(res.status).toBe(401);
	});
});

describe("GET /users/profile (authorized)", () => {
	it("should return profile details for user", async () => {
		const res = await profile_get.request("/", {
			method: "GET",
			headers: { Authorization: `Bearer ${dummyPayload}` },
		});

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toHaveProperty("profile");
		expect(body.profile).toMatchObject({
			id: userId,
			credits: expect.any(Number),
			level: expect.any(String),
			created_at: expect.any(String),
		});
	});
});
