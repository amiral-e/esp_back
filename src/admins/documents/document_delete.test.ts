import { describe, expect, it } from "bun:test";
import document_delete from "./document_delete_def.ts";
import config from "../../config.ts";
import { generatePayload } from "../../middlewares/utils.ts";
import { createGlobalCollection } from "../collections/utils.ts";

let adminPayload = await generatePayload(config.envVars.ADMIN_ID);
const wrongPayload = await generatePayload(config.envVars.WRONG_ID);
const collectionName = `test_collec`;
let docId = "";

describe("DELETE /admins/documents/:collection_name/documents/:document_id (unauthorized)", () => {
	it("missing authorization header", async () => {
		const res = await document_delete.request(
			`/${collectionName}/documents/2`,
			{
				method: "DELETE",
			},
		);
		expect(await res.json()).toEqual({
			error: "No authorization header found",
		});
		expect(res.status).toBe(401);
	});

	it("invalid authorization header", async () => {
		const res = await document_delete.request(
			`/${collectionName}/documents/2`,
			{
				method: "DELETE",
				headers: { Authorization: `Bearer wrong-header` },
			},
		);
		expect(await res.json()).toEqual({
			error: "Invalid authorization header",
		});
		expect(res.status).toBe(401);
	});

	it("non-user authorization header", async () => {
		const res = await document_delete.request(
			`/${collectionName}/documents/2`,
			{
				method: "DELETE",
				headers: { Authorization: `Bearer ${wrongPayload}` },
			},
		);
		expect(await res.json()).toEqual({
			error: "Invalid user",
		});
		expect(res.status).toBe(401);
	});
});

describe("DELETE /admins/documents/:collection_name/documents/:document_id (authorized)", () => {
	it("should return 404 when document not found", async () => {
		const res = await document_delete.request(
			`/${collectionName}/documents/nonexistent-doc`,
			{
				method: "DELETE",
				headers: { Authorization: `Bearer ${adminPayload}` },
			},
		);
		expect(res.status).toBe(404);
		expect(await res.json()).toEqual({
			error: "Document not found",
		});
	});

	it("should delete a document", async () => {
		// Create a test document
		docId = await createGlobalCollection(
			config.envVars.ADMIN_ID,
			"global_test_collec",
		);

		if (docId == "") {
			expect(true).toBe(false);
			expect("").toBe("Couldn't create document and collection");
			return;
		}

		const res = await document_delete.request(
			`/${collectionName}/documents/${docId}`,
			{
				method: "DELETE",
				headers: { Authorization: `Bearer ${adminPayload}` },
			},
		);

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({
			message: "Document deleted successfully",
		});
	});
});
