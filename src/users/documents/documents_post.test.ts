import {
    describe,
    expect,
    it,
    beforeEach,
    beforeAll,
    afterAll,
} from "bun:test";
import document_post from "./documents_post.ts";
import config from "../../config.ts";
import { generatePayload } from "../../middlewares/utils.ts";
import { createCollection, deleteCollection } from "../collections/utils.ts";
import admin from "../../admins/index.ts";

const userId = config.envVars.DUMMY_ID;
let dummyPayload = await generatePayload(userId);
const wrongPayload = await generatePayload(config.envVars.WRONG_ID);
const collectionName = `test_collec`;

afterAll(async () => {
    await deleteCollection(userId + '_' + collectionName);
});

describe("POST /users/documents/:collection_name/documents (unauthorized)", () => {
    it("missing authorization header", async () => {
        const res = await document_post.request(`/${collectionName}/documents`, {
            method: "POST",
            body: new FormData(),
        });
        expect(await res.json()).toEqual({
            error: "No authorization header found",
        });
        expect(res.status).toBe(401);
    });

    it("invalid authorization header", async () => {
        const res = await document_post.request(`/${collectionName}/documents`, {
            method: "POST",
            headers: { Authorization: `Bearer wrong-header` },
            body: new FormData(),
        });
        expect(await res.json()).toEqual({
            error: "Invalid authorization header",
        });
        expect(res.status).toBe(401);
    });

    it("non-user authorization header", async () => {
        const res = await document_post.request(`/${collectionName}/documents`, {
            method: "POST",
            headers: { Authorization: `Bearer ${wrongPayload}` },
            body: new FormData(),
        });
        expect(await res.json()).toEqual({
            error: "Invalid user",
        });
        expect(res.status).toBe(401);
    });
});

describe("POST /users/documents/:collection_name/documents (authorized)", () => {
    it("should return success when ingesting documents", async () => {
        const file = new File(["test content"], "test.md", {
            type: "text/markdown",
        });
        const formData = new FormData();
        formData.append("file", file);

        const res = await document_post.request(`/${collectionName}/documents`, {
            method: "POST",
            headers: { Authorization: `Bearer ${dummyPayload}` },
            body: formData,
        });

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({
            message: "You have ingested 1 documents into the collection test_collec",
        });
    });

    it("should return 400 for invalid file types", async () => {
        const file = new File(["test content"], "test.png");
        const formData = new FormData();
        formData.append("file", file);

        const res = await document_post.request(`/${collectionName}/documents`, {
            method: "POST",
            headers: { Authorization: `Bearer ${dummyPayload}` },
            body: formData,
        });

        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({
            error: "File type not allowed",
        });
    });

    it("should return 400 when providing multiple files", async () => {
        const file1 = new File(["content1"], "file1.md");
        const file2 = new File(["content2"], "file2.md");
        const formData = new FormData();
        formData.append("file", file1);
        formData.append("file", file2);

        const res = await document_post.request(`/${collectionName}/documents`, {
            method: "POST",
            headers: { Authorization: `Bearer ${dummyPayload}` },
            body: formData,
        });

        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({
            error: "Please provide a single file in file",
        });
    });
});