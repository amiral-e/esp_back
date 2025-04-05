import {
	describe,
	expect,
	it,
	beforeAll,
	afterAll,
} from "bun:test";
import announcement_put from "./announcement_put.ts";
import config from "../../../config.ts";
import { generatePayload } from "../../../middlewares/utils.ts";

let adminPayload = await generatePayload(config.envVars.ADMIN_ID);
let dummyPayload = await generatePayload(config.envVars.DUMMY_ID);
const wrongPayload = await generatePayload(config.envVars.WRONG_ID);

let testAnnouncementId: number;

beforeAll(async () => {
	const { data } = await config.supabaseClient
		.from("announcements")
		.insert({ message: "Test Annoncement" })
		.select()
		.single();

	testAnnouncementId = data.id;
});

afterAll(async () => {
	await config.supabaseClient
		.from("announcements")
		.delete()
		.eq("id", testAnnouncementId);
});

describe("PUT /announcements/:id (without privileges)", () => {
	it("missing authorization header", async () => {
		const res = await announcement_put.request(`/${testAnnouncementId}`, {
			method: "PUT",
		});
		expect(await res.json()).toEqual({
			error: "No authorization header found",
		});
		expect(res.status).toBe(401);
	});

	it("invalid authorization header", async () => {
		const res = await announcement_put.request(`/${testAnnouncementId}`, {
			method: "PUT",
			headers: { Authorization: `Bearer wrong-header` },
		});
		expect(await res.json()).toEqual({
			error: "Invalid authorization header",
		});
		expect(res.status).toBe(401);
	});

	it("non-user authorization header", async () => {
		const res = await announcement_put.request(`/${testAnnouncementId}`, {
			method: "PUT",
			headers: { Authorization: `Bearer ${wrongPayload}` },
		});
		expect(await res.json()).toEqual({
			error: "Invalid user",
		});
		expect(res.status).toBe(401);
	});

	it("regular user without admin privileges", async () => {
		const res = await announcement_put.request(`/${testAnnouncementId}`, {
			method: "PUT",
			headers: { Authorization: `Bearer ${dummyPayload}` },
		});
		expect(await res.json()).toEqual({
			error: "Forbidden",
		});
		expect(res.status).toBe(403);
	});
});

describe("PUT /announcements/:id (with privileges)", () => {
	it("invalid JSON", async () => {
		const res = await announcement_put.request(`/${testAnnouncementId}`, {
			method: "PUT",
			headers: { Authorization: `Bearer ${adminPayload}` },
		});
		expect(await res.json()).toEqual({
			error: "Invalid JSON",
		});
		expect(res.status).toBe(400);
	});

	it("missing message field", async () => {
		const res = await announcement_put.request(`/${testAnnouncementId}`, {
			method: "PUT",
			headers: { Authorization: `Bearer ${adminPayload}` },
			body: JSON.stringify({}),
		});
		expect(await res.json()).toEqual({
			error: "Invalid JSON",
		});
		expect(res.status).toBe(400);
	});

	it("non-existent announcement", async () => {
		const res = await announcement_put.request("/999999", {
			method: "PUT",
			headers: { Authorization: `Bearer ${adminPayload}` },
			body: JSON.stringify({ message: "Updated message" }),
		});
		expect(await res.json()).toEqual({
			error: "Announcement not found",
		});
		expect(res.status).toBe(404);
	});

	it("successful announcement update", async () => {
		const res = await announcement_put.request(`/${testAnnouncementId}`, {
			method: "PUT",
			headers: { Authorization: `Bearer ${adminPayload}` },
			body: JSON.stringify({ message: "Updated announcement" }),
		});
		expect(res.status).toBe(200);
		const res_data = await res.json();
		expect(res_data.message).toEqual("Announcement updated successfully");
	});
});
