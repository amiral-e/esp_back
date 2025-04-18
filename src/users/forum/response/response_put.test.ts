import {
	describe,
	expect,
	it,
	beforeAll,
	afterAll,
} from "bun:test";
import response_post from "./response_post";
import response_put from "./response_put";

import config from "../../../config.ts";
import { generatePayload } from "../../../middlewares/utils.ts";

let dummyPayload = await generatePayload(config.envVars.DUMMY_ID);
let dummyPayload2 = await generatePayload(config.envVars.DUMMY2_ID);
const wrongPayload = await generatePayload(config.envVars.WRONG_ID);

async function cleanupResponse(id: number) {
	await config.supabaseClient.from("responses").delete().eq("id", id);
}

describe("PUT /forum/response/:id", () => {
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

	afterAll(async () => {
		await cleanupResponse(createdResponse?.id);
	});

	it("should update own response as user", async () => {
		const newMessage = "Updated message";
		const res = await response_put.request(`/${createdResponse.id}`, {
			method: "PUT",
			headers: {
				Authorization: `Bearer ${dummyPayload}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ message: newMessage }),
		});

		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.message).toBe("Response updated successfully");
	});

	it("should not update other user response as user", async () => {
		const res = await response_put.request(`/${createdResponse.id}`, {
			method: "PUT",
			headers: {
				Authorization: `Bearer ${dummyPayload2}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ message: "Trying to update" }),
		});

		expect(res.status).toBe(403);
		const data = await res.json();
		expect(data.error).toBe("Forbidden");
	});

	it("should return 404 for non-existent response", async () => {
		const res = await response_put.request("/999999", {
			method: "PUT",
			headers: {
				Authorization: `Bearer ${dummyPayload}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ message: "New message" }),
		});

		expect(res.status).toBe(404);
		const data = await res.json();
		expect(data.error).toBe("Response not found");
	});
});
