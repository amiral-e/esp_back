import {
	describe,
	expect,
	it,
	beforeAll,
	afterAll,
	beforeEach,
} from "bun:test";
import responses from "..";
import config from "../../../config";
import envVars from "../../../config";
import response_post from "./response_post";
import response_delete from "./response_delete";
import user_jwt_gen from "../../../test/user_jwt_gen";
import { insertAdmin, deleteAdmin } from "../../../admins/utils";

async function cleanupResponse(id: number) {
	await config.supabaseClient.from("responses").delete().eq("id", id);
}

async function generateJWT(uid: string) {
	const res = await user_jwt_gen.request("/", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ uid }),
	});
	const data = await res.json();
	return data.token;
}

describe("DELETE /forum/response/:id", () => {
	const otherUser_id = "5d23e16f-1783-4247-90c4-a026071b6687";
	let createdResponse: any;
	let otherResponse: any;
	let otherUserJWT: string;

	beforeAll(async () => {
		otherUserJWT = await generateJWT(otherUser_id);
		const res = await response_post.request("/", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${envVars.DUMMY_JWT_PAYLOAD}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ message: "New response message" }),
		});
		createdResponse = await res.json();
	});

	afterAll(async () => {
		await cleanupResponse(otherResponse?.id);
		await deleteAdmin(otherUser_id);
	});

	it("should delete own response as user", async () => {
		const res = await response_delete.request(`/${createdResponse.id}`, {
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${envVars.DUMMY_JWT_PAYLOAD}`,
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

	it("should not delete other user response as user", async () => {
		const otherRes = await response_post.request("/", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${otherUserJWT}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ message: "Other user message" }),
		});
		otherResponse = await otherRes.json();

		const res = await response_delete.request(`/${otherResponse.id}`, {
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${envVars.DUMMY_JWT_PAYLOAD}`,
			},
		});

		expect(res.status).toBe(403);
		const data = await res.json();
		expect(data.error).toBe("Not authorized to delete this response");
	});

	it("should delete any response as admin", async () => {
		await insertAdmin(otherUser_id);
		const otherRes = await response_post.request("/", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${envVars.DUMMY_JWT_PAYLOAD}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ message: "Other user message" }),
		});
		const otherResponse = await otherRes.json();

		const res = await response_delete.request(`/${otherResponse.id}`, {
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${otherUserJWT}`,
			},
		});

		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.message).toBe("Response deleted successfully");
	});
});
