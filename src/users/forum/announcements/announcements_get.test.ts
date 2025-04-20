import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import announcements_get from "./announcements_get_def.ts";
import config from "../../../config.ts";

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
		.eq("id", testAnnouncementId);
});

describe("GET /announcements", () => {
	it("get all announcements", async () => {
		const res = await announcements_get.request("/", {
			method: "GET",
		});
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(Array.isArray(data.announcements)).toBe(true);
		expect(data.announcements[0].id == testAnnouncementId);
	});
});
