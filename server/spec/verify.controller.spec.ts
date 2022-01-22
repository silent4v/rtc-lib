import { app } from "../app";
import request from "supertest";

describe("verify route, if user data is object", () => {
  let response;
  const userData = {
    id: "user-id",
    field: {
      balance: 30,
      sessionId: "jest-testsid"
    }
  };

  it("POST /api/v1/access", async () => {
    response = await request(app)
      .post("/api/v1/access")
      .set("content-type", "application/json")
      .send({
        room: "room1",
        userData,
      })
      .expect(200);

    const token = response.body.token;
    expect(token.length).toEqual(32);
    expect(/[0-9a-f]{16}/.test(token)).toBeTruthy();
  });

  it("GET /api/v1/access/:token", async () => {
    const verifyReq = await request(app).get(`/api/v1/access/${response.body.token}`);
    expect(verifyReq.body.state).toBe("authorized");
    expect(verifyReq.body.data).toStrictEqual(userData);
  });
});

describe("verify route, if user data is string", () => {
  let response;
  const userData = "STRING";

  it("POST /api/v1/access", async () => {
    response = await request(app)
      .post("/api/v1/access")
      .set("content-type", "application/json")
      .send({
        room: "room1",
        userData,
      })
      .expect(200);

    const token = response.body.token;
    expect(token.length).toEqual(32);
    expect(/[0-9a-f]{16}/.test(token)).toBeTruthy();
  });

  it("GET /api/v1/access/:token", async () => {
    const verifyReq = await request(app).get(`/api/v1/access/${response.body.token}`);
    expect(verifyReq.body.state).toBe("authorized");
    expect(verifyReq.body.data).toStrictEqual(userData);
  });
});

describe("verify route, if user data is empty", () => {
  let response;

  it("POST /api/v1/access", async () => {
    response = await request(app)
    .post("/api/v1/access")
    .set("content-type", "application/json")
    .send({
      room: "room1",
    })
    .expect(200);

    const token = response.body.token;
    expect(token.length).toEqual(32);
    expect(/[0-9a-f]{16}/.test(token)).toBeTruthy();
  });

  it("GET /api/v1/access/:token", async () => {
    const verifyReq = await request(app).get(`/api/v1/access/${response.body.token}`);
    expect(verifyReq.body.state).toBe("authorized");
    expect(verifyReq.body.data).toStrictEqual({});
  });
});

describe("verify route, when request failed", () => {
  let response;

  it("POST /api/v1/access", async () => {
    response = await request(app)
    .post("/api/v1/access")
    .set("content-type", "application/json")
    .expect(400);

    expect(response.body.message).toEqual("invaild room");
  });

  it("GET /api/v1/access/:token", async () => {
    const verifyReq = await request(app).get(`/api/v1/access/wrong-token`);
    expect(verifyReq.body.state).toBe("unauthorized");
    expect(verifyReq.body.data).toBe(undefined);
  });
});