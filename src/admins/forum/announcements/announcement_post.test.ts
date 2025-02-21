import {
  describe,
  expect,
  it,
  beforeAll,
  afterAll,
  beforeEach,
} from "bun:test";
import announcement_post from "./announcement_post.ts";
import envVars from "../../../config_test.ts";
import { insertAdmin, deleteAdmin } from "../../utils.ts";
import config from "../../../config.ts";
import user_jwt_gen from "../../../test/user_jwt_gen.ts";

afterAll(async () => {
  await deleteAdmin(envVars.DUMMY_ID);
});

describe("POST /announcements (without privileges)", () => {
  let jwt_token: any;
  beforeAll(async () => {
    const res = await user_jwt_gen.request("/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uid: envVars.DUMMY_ID_2 }),
    });
    const data = await res.json();
    jwt_token = data.token;
  });

  it("missing authorization header", async () => {
    const res = await announcement_post.request("/", {
      method: "POST",
    });
    expect(await res.json()).toEqual({
      error: "No authorization header found",
    });
    expect(res.status).toBe(401);
  });

  it("invalid authorization header", async () => {
    const res = await announcement_post.request("/", {
      method: "POST",
      headers: { Authorization: `Bearer wrong-header` },
    });
    expect(await res.json()).toEqual({
      error: "Invalid authorization header",
    });
    expect(res.status).toBe(401);
  });

  it("non-user authorization header", async () => {
    const res = await announcement_post.request("/", {
      method: "POST",
      headers: { Authorization: `Bearer ${envVars.WRONG_JWT_PAYLOAD}` },
    });
    expect(await res.json()).toEqual({
      error: "Invalid user",
    });
    expect(res.status).toBe(401);
  });

  it("regular user without admin privileges", async () => {
    const res = await announcement_post.request("/", {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt_token}` },
    });
    expect(await res.json()).toEqual({
      error: "Forbidden",
    });
    expect(res.status).toBe(403);
  });
});

describe("POST /announcements (with privileges)", () => {
  beforeAll(async () => {
    await insertAdmin(envVars.DUMMY_ID);
  });

  it("invalid JSON", async () => {
    const res = await announcement_post.request("/", {
      method: "POST",
      headers: { Authorization: `Bearer ${envVars.DUMMY_JWT_PAYLOAD}` },
    });
    expect(await res.json()).toEqual({
      error: "Invalid JSON",
    });
    expect(res.status).toBe(400);
  });

  it("missing message field", async () => {
    const res = await announcement_post.request("/", {
      method: "POST",
      headers: { Authorization: `Bearer ${envVars.DUMMY_JWT_PAYLOAD}` },
      body: JSON.stringify({}),
    });
    expect(await res.json()).toEqual({
      error: "Invalid JSON",
    });
    expect(res.status).toBe(400);
  });

  it("successful announcement creation", async () => {
    const res = await announcement_post.request("/", {
      method: "POST",
      headers: { Authorization: `Bearer ${envVars.DUMMY_JWT_PAYLOAD}` },
      body: JSON.stringify({ message: "Test announcement" }),
    });
    expect(res.status).toBe(200);
    const res_data = await res.json();
    expect(res_data.message).toEqual("Announcement created successfully");
    await config.supabaseClient
      .from("announcements")
      .delete()
      .eq("id", res_data.data.id);
  });
});
