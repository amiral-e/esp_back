import {
    describe,
    expect,
    it,
    beforeAll,
    afterAll,
    beforeEach,
} from "bun:test";
import announcement_delete from "./announcement_delete.ts";
import envVars from "../../../config_test.ts";
import config from "../../../config.ts";
import { insertAdmin, deleteAdmin } from "../../utils.ts";

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
    await deleteAdmin(envVars.DUMMY_ID);
    if (testAnnouncementId) {
        await config.supabaseClient
            .from("announcements")
            .delete()
            .eq("id", testAnnouncementId);
    }
});

describe("DELETE /announcements/:id (without privileges)", () => {
    beforeEach(async () => {
        await deleteAdmin(envVars.DUMMY_ID);
    });

    it("missing authorization header", async () => {
        const res = await announcement_delete.request(`/${testAnnouncementId}`, {
            method: "DELETE",
        });
        expect(await res.json()).toEqual({
            error: "No authorization header found",
        });
        expect(res.status).toBe(401);
    });

    it("invalid authorization header", async () => {
        const res = await announcement_delete.request(`/${testAnnouncementId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer wrong-header` },
        });
        expect(await res.json()).toEqual({
            error: "Invalid authorization header",
        });
        expect(res.status).toBe(401);
    });

    it("non-user authorization header", async () => {
        const res = await announcement_delete.request(`/${testAnnouncementId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${envVars.WRONG_JWT_PAYLOAD}` },
        });
        expect(await res.json()).toEqual({
            error: "Invalid user",
        });
        expect(res.status).toBe(401);
    });

    it("correct authorization header but no admin privileges", async () => {
        const res = await announcement_delete.request(`/${testAnnouncementId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${envVars.DUMMY_JWT_PAYLOAD}` },
        });
        expect(await res.json()).toEqual({
            error: "Forbidden",
        });
        expect(res.status).toBe(403);
    });
});

describe("DELETE /announcements/:id (with privileges)", () => {
    beforeEach(async () => {
        await insertAdmin(envVars.DUMMY_ID);
    });

    it("non-existent announcement", async () => {
        const res = await announcement_delete.request("/999999", {
            method: "DELETE",
            headers: { Authorization: `Bearer ${envVars.DUMMY_JWT_PAYLOAD}` },
        });
        expect(await res.json()).toEqual({
            error: "Announcement not found",
        });
        expect(res.status).toBe(404);
    });

    it("successfully delete announcement", async () => {
        // Create a new announcement to delete
        const { data: newAnnouncement } = await config.supabaseClient
            .from("announcements")
            .insert({ message: "Announcement to delete" })
            .select()
            .single();

        const res = await announcement_delete.request(`/${newAnnouncement.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${envVars.DUMMY_JWT_PAYLOAD}` },
        });
        expect(await res.json()).toEqual({
            message: "Announcement deleted successfully",
        });
        expect(res.status).toBe(200);

        // Verify the announcement was deleted
        const { data: deleted } = await config.supabaseClient
            .from("announcements")
            .select()
            .eq("id", newAnnouncement.id)
            .single();
        expect(deleted).toBe(null);
    });
});
