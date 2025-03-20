import {
	describe,
	expect,
	it,
	beforeAll,
	afterAll,
	beforeEach,
} from "bun:test";
import announcement_post from "./announcement_post.ts";
import config from "../../../config.ts";
import { generatePayload } from "../../../middlewares/utils.ts";

let adminPayload = await generatePayload(config.envVars.ADMIN_ID);
let dummyPayload = await generatePayload(config.envVars.DUMMY_ID);
const wrongPayload = await generatePayload(config.envVars.WRONG_ID);

describe("POST /announcements (without privileges)", () => {
	it("missing authorization header", async () => {
		const res = await announcement_post.request("/", {
			method: "POST",
		});
		expect(await res.json()).toEqual({
			error: "No authorization header found",
		});
		expect(res.status).toBe(401);
	});

	it("invalid authorization header", async () => {
		const res = await announcement_post.request("/", {
			method: "POST",
			headers: { Authorization: `Bearer wrong-header` },
		});
		expect(await res.json()).toEqual({
			error: "Invalid authorization header",
		});
		expect(res.status).toBe(401);
	});

	it("non-user authorization header", async () => {
		const res = await announcement_post.request("/", {
			method: "POST",
			headers: { Authorization: `Bearer ${wrongPayload}` },
		});
		expect(await res.json()).toEqual({
			error: "Invalid user",
		});
		expect(res.status).toBe(401);
	});

	it("regular user without admin privileges", async () => {
		const res = await announcement_post.request("/", {
			method: "POST",
			headers: { Authorization: `Bearer ${dummyPayload}` },
		});
		expect(await res.json()).toEqual({
			error: "Forbidden",
		});
		expect(res.status).toBe(403);
	});
});

describe("POST /announcements (with privileges)", () => {
	it("invalid JSON", async () => {
		const res = await announcement_post.request("/", {
			method: "POST",
			headers: { Authorization: `Bearer ${adminPayload}` },
		});
		expect(await res.json()).toEqual({
			error: "Invalid JSON",
		});
		expect(res.status).toBe(400);
	});

	it("missing message field", async () => {
		const res = await announcement_post.request("/", {
			method: "POST",
			headers: { Authorization: `Bearer ${adminPayload}` },
			body: JSON.stringify({}),
		});
		expect(await res.json()).toEqual({
			error: "Invalid JSON",
		});
		expect(res.status).toBe(400);
	});

	it("successful announcement creation", async () => {
		const res = await announcement_post.request("/", {
			method: "POST",
			headers: { Authorization: `Bearer ${adminPayload}` },
			body: JSON.stringify({ message: "Test announcement" }),
		});
		expect(res.status).toBe(200);
		const res_data = await res.json();
		expect(res_data.message).toEqual("Announcement created successfully");
	});
});
