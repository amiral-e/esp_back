import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import announcement_delete from "./announcement_delete_def.ts";
import config from "../../../config.ts";
import { generatePayload } from "../../../middlewares/utils.ts";

let adminPayload = await generatePayload(config.envVars.ADMIN_ID);
let dummyPayload = await generatePayload(config.envVars.DUMMY_ID);
const wrongPayload = await generatePayload(config.envVars.WRONG_ID);

let testAnnouncementId: number;

beforeAll(async () => {
	const { data } = await config.supabaseClient
		.from("announcements")
		.insert({ message: "Test announcement" })
		.select()
		.single();
	testAnnouncementId = data.id;
});

afterAll(async () => {
	await config.supabaseClient
		.from("announcements")
		.delete()
		.neq("id", 0);
});

describe("DELETE /announcements/:id (without privileges)", () => {
	it("missing authorization header", async () => {
		const res = await announcement_delete.request(`/${testAnnouncementId}`, {
			method: "DELETE",
		});
		expect(await res.json()).toEqual({
			error: "No authorization header found",
		});
		expect(res.status).toBe(401);
	});

	it("invalid authorization header", async () => {
		const res = await announcement_delete.request(`/${testAnnouncementId}`, {
			method: "DELETE",
			headers: { Authorization: `Bearer wrong-header` },
		});
		expect(await res.json()).toEqual({
			error: "Invalid authorization header",
		});
		expect(res.status).toBe(401);
	});

	it("non-user authorization header", async () => {
		const res = await announcement_delete.request(`/${testAnnouncementId}`, {
			method: "DELETE",
			headers: { Authorization: `Bearer ${wrongPayload}` },
		});
		expect(await res.json()).toEqual({
			error: "Invalid user",
		});
		expect(res.status).toBe(401);
	});

	it("correct authorization header but no admin privileges", async () => {
		const res = await announcement_delete.request(`/${testAnnouncementId}`, {
			method: "DELETE",
			headers: { Authorization: `Bearer ${dummyPayload}` },
		});
		expect(await res.json()).toEqual({
			error: "Forbidden",
		});
		expect(res.status).toBe(403);
	});
});

describe("DELETE /announcements/:id (with privileges)", () => {
	it("non-existent announcement", async () => {
		const res = await announcement_delete.request("/999999", {
			method: "DELETE",
			headers: { Authorization: `Bearer ${adminPayload}` },
		});
		expect(await res.json()).toEqual({
			error: "Announcement not found",
		});
		expect(res.status).toBe(404);
	});

	it("successfully delete announcement", async () => {
		const res = await announcement_delete.request(`/${testAnnouncementId}`, {
			method: "DELETE",
			headers: { Authorization: `Bearer ${adminPayload}` },
		});
		expect(await res.json()).toEqual({
			message: "Announcement deleted successfully",
		});
		expect(res.status).toBe(200);
	});
});
