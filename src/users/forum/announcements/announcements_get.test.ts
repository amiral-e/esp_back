import {
	describe,
	expect,
	it,
	beforeAll,
	afterAll,
	beforeEach,
} from "bun:test";
import announcements_get from "./announcements_get.ts";
import envVars from "../../../config.ts";
import config from "../../../config.ts";
import { insertAdmin, deleteAdmin } from "../../../admins/utils.ts";

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
		expect(Array.isArray(data)).toBe(true);
		expect(data.some((a: any) => a.id === testAnnouncementId)).toBe(true);
	});
});
