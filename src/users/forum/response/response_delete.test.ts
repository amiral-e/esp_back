import {
	describe,
	expect,
	it,
	beforeAll,
} from "bun:test";

import response_post from "./response_post_def.ts";
import response_delete from "./response_delete_def.ts";

import config from "../../../config.ts";
import { generatePayload } from "../../../middlewares/utils.ts";

let adminPayload = await generatePayload(config.envVars.ADMIN_ID);
let dummyPayload = await generatePayload(config.envVars.DUMMY_ID);
let dummyPayload2 = await generatePayload(config.envVars.DUMMY2_ID);

describe("DELETE /forum/response/:id", () => {
	let createdResponse: any;

	beforeAll(async () => {
		const res = await response_post.request("/", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${dummyPayload}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ message: "New response message" }),
		});
		createdResponse = await res.json();
	});

	it("should not delete other user response as user", async () => {
		const res = await response_delete.request(`/${createdResponse?.id}`, {
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${dummyPayload2}`,
			},
		});

		expect(res.status).toBe(403);
		const data = await res.json();
		expect(data.error).toBe("Forbidden");
	});

	it("should delete own response as user", async () => {
		const res = await response_delete.request(`/${createdResponse.id}`, {
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${dummyPayload}`,
			},
		});

		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.message).toBe("Response deleted successfully");

		const { data: checkData } = await config.supabaseClient
			.from("responses")
			.select("*")
			.eq("id", createdResponse.id);
		expect(checkData).toHaveLength(0);
	});

	it("should delete any response as admin", async () => {
		const otherRes = await response_post.request("/", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${dummyPayload}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ message: "Other user message" }),
		});
		const otherResponse = await otherRes.json();

		const res = await response_delete.request(`/${otherResponse.id}`, {
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${adminPayload}`,
			},
		});

		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.message).toBe("Response deleted successfully");
	});
});
