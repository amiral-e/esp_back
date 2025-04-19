import { describe, expect, it, afterAll } from "bun:test";
import { generatePayload } from "../../middlewares/utils.ts";
import reports_get from "./reports_get_def.ts";

import config from "../../config.ts";
import { createReport, deleteReport } from "./utils.ts";

const userPayload = await generatePayload(config.envVars.DUMMY_ID);
let reportId = "";

afterAll(async () => {
	await deleteReport(reportId);
});

describe("GET /users/reports", () => {
	it("should return 401 without authentication", async () => {
		const res = await reports_get.request("/", {
			method: "GET",
		});
		expect(res.status).toBe(401);
		expect(await res.json()).toEqual({
			error: "No authorization header found",
		});
	});

	it("should return 404 with no reports", async () => {
		const res = await reports_get.request("/", {
			method: "GET",
			headers: { Authorization: `Bearer ${userPayload}` },
		});
		expect(res.status).toBe(404);
		expect(await res.json()).toEqual({
			error: "No report found",
		});
	});

	it("should return reports with valid authentication and reports", async () => {
		// Créer un rapport pour l'utilisateur
		reportId = await createReport(config.envVars.DUMMY_ID);

		const res = await reports_get.request("/", {
			method: "GET",
			headers: { Authorization: `Bearer ${userPayload}` },
		});
		expect(res.status).toBe(200);
		expect(await res.json()).toBeInstanceOf(Array);
	});
});
