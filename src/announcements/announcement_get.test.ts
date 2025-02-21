import {
  describe,
  expect,
  it,
  beforeAll,
  afterAll,
  beforeEach,
} from "bun:test";
import announcement_get from "./announcement_get.ts";
import envVars from "../config_test.ts";
import config from "../config.ts";
import { insertAdmin, deleteAdmin } from "../admins/utils.ts";

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
  await config.supabaseClient
      .from("announcements")
      .delete()
      .eq("id", testAnnouncementId);
});

describe("GET /announcements", () => {

  it("get all announcements", async () => {
      const res = await announcement_get.request("/", {
          method: "GET",
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.some((a: any) => a.id === testAnnouncementId)).toBe(true);
  });
});

describe("GET /announcements/:id", () => {
  it("get specific announcement as regular user", async () => {
      const res = await announcement_get.request(`/${testAnnouncementId}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${envVars.DUMMY_JWT_PAYLOAD}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe(testAnnouncementId);
      expect(data.message).toBe("Test announcement");
  });


  it("get non-existent announcement", async () => {
      const res = await announcement_get.request("/999999", {
          method: "GET",
          headers: { Authorization: `Bearer ${envVars.DUMMY_JWT_PAYLOAD}` },
      });
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({
          error: "Announcement not found",
      });
  });
});
