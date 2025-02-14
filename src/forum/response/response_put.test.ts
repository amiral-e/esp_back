import {
  describe,
  expect,
  it,
  beforeAll,
  afterAll,
  beforeEach,
} from "bun:test";
import responses from "..";
import config from "../../config";
import envVars from "../../config_test";
import response_post from "./response_post";
import response_put from "./response_put";
import user_jwt_gen from "../../test/user_jwt_gen";

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

describe("PUT /forum/response/:id", () => {
  let createdResponse: any;
  let otherResponse: any;
  let otherUserJWT: string;

  beforeAll(async () => {
    otherUserJWT = await generateJWT("5d23e16f-1783-4247-90c4-a026071b6687");
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
    await cleanupResponse(createdResponse?.id);
    await cleanupResponse(otherResponse?.id);
  });

  it("should update own response as user", async () => {
    const newMessage = "Updated message";
    const res = await response_put.request(`/${createdResponse.id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${envVars.DUMMY_JWT_PAYLOAD}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: newMessage }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toBe(newMessage);
    expect(data.id).toBe(createdResponse.id);
  });

  it("should not update other user response as user", async () => {
    const otherRes = await response_post.request("/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${otherUserJWT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Other user message" }),
    });
    otherResponse = await otherRes.json();

    const res = await response_put.request(`/${otherResponse.id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${envVars.DUMMY_JWT_PAYLOAD}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Trying to update" }),
    });

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe("Not authorized to update this response");
  });

  it("should return 404 for non-existent response", async () => {
    const res = await response_put.request("/999999", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${envVars.DUMMY_JWT_PAYLOAD}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "New message" }),
    });

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe("Response not found");
  });
});
