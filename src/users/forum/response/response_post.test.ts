import { describe, expect, it } from "bun:test";
import response_post from "./response_post_def.ts";
import config from "../../../config.ts";
import { generatePayload } from "../../../middlewares/utils.ts";

let dummyPayload = await generatePayload(config.envVars.DUMMY_ID);

describe("POST /forum/response", () => {
	describe("Response creation tests", () => {
		it("invalid JSON body", async () => {
			const res = await response_post.request(`/`, {
				method: "POST",
				headers: { Authorization: `Bearer ${dummyPayload}` },
			});
			expect(res.status).toBe(400);
			const data = await res.json();
			expect(data).toEqual({ error: "Invalid JSON body" });
		});

		it("missing message in body", async () => {
			const res = await response_post.request(`/`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${dummyPayload}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({}),
			});
			expect(res.status).toBe(400);
			const data = await res.json();
			expect(data).toEqual({ error: "Message is required" });
		});

		it("successful response creation", async () => {
			const testMessage = "Test response message";

			const res = await response_post.request(`/`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${dummyPayload}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ message: testMessage }),
			});

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data?.message).toBe("Response added successfully");
			// delete response for dynamique id
			await config.supabaseClient.from("responses").delete().eq("id", data.id);
		});
	});
});
