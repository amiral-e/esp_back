import { describe, expect, it, beforeAll } from "bun:test";
import { generatePayload } from "../../middlewares/utils.ts";
import report_delete from "./report_delete_def.ts";

import config from "../../config.ts";
import { createReport, deleteReport } from "./utils.ts";

const userPayload = await generatePayload(config.envVars.DUMMY_ID);
let reportId = "";

beforeAll(async () => {
	reportId = await createReport(config.envVars.DUMMY_ID);
});

describe("DELETE /users/reports/:report_id", () => {
	it("should return 401 without authentication", async () => {
		const res = await report_delete.request(`/${reportId}`, {
			method: "DELETE",
		});
		expect(res.status).toBe(401);
		expect(await res.json()).toEqual({
			error: "No authorization header found",
		});
	});

	it("should return 404 with invalid report ID", async () => {
		const res = await report_delete.request("/invalid-report-id", {
			method: "DELETE",
			headers: { Authorization: `Bearer ${userPayload}` },
		});
		expect(res.status).toBe(404);
		expect(await res.json()).toEqual({
			error: "Report not found",
		});
	});

	it("should return success message with valid report ID", async () => {
		const res = await report_delete.request(`/${reportId}`, {
			method: "DELETE",
			headers: { Authorization: `Bearer ${userPayload}` },
		});
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({
			message: "Report deleted successfully",
		});
	});
});
