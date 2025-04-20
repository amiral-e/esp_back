import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import { generatePayload } from "../../middlewares/utils.ts";
import report_get from "./report_get_def.ts";

import config from "../../config.ts";
import { createReport, deleteReport } from "./utils.ts";

const userPayload = await generatePayload(config.envVars.DUMMY_ID);
let reportId = "";

beforeAll(async () => {
	reportId = await createReport(config.envVars.DUMMY_ID);
});

afterAll(async () => {
	await deleteReport(reportId);
});

describe("GET /users/reports/:report_id", () => {
	it("should return 401 without authentication", async () => {
		const res = await report_get.request("/0", {
			method: "GET",
		});
		expect(res.status).toBe(401);
		expect(await res.json()).toEqual({
			error: "No authorization header found",
		});
	});

	it("should return 404 with invalid report ID", async () => {
		const res = await report_get.request("/invalid-report-id", {
			method: "GET",
			headers: { Authorization: `Bearer ${userPayload}` },
		});
		expect(res.status).toBe(404);
		expect(await res.json()).toEqual({
			error: "Report not found",
		});
	});

	it("should return report details with valid report ID", async () => {
		const res = await report_get.request(`/${reportId}`, {
			method: "GET",
			headers: { Authorization: `Bearer ${userPayload}` },
		});
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toHaveProperty("title");
		expect(json).toHaveProperty("text");
	});
});
