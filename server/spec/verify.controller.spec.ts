import { app } from "../app";
import request from "supertest";
import { createServer, Server } from "http";

describe("verify route, if user data is object", () => {
  let response;
  const userData = {
    id: "user-id",
    field: {
      balance: 30,
      sessionId: "jest-testsid"
    }
  };

  it("GET /api/v1/access?data=<object>", async () => {
    response = await request(app)
      .get("/api/v1/access")
      .query({ data: JSON.stringify(userData) })
      .query({ room: "room" })
      .expect(200);

    const token = response.body.token;
    expect(token.length).toEqual(32);
    expect(/[0-9a-f]{16}/.test(token)).toBeTruthy();
  });

  it("POST /api/v1/access/:token", async () => {
    const verifyReq = await request(app).post(`/api/v1/access/${response.body.token}`);
    expect(verifyReq.body.state).toBe("authorized");
    expect(verifyReq.body.data).toStrictEqual(userData);
  });
});

describe("verify route, if user data is string", () => {
  let response;
  const userData = "STRING";

  it("GET /api/v1/access?data=string", async () => {
    response = await request(app)
      .get("/api/v1/access")
      .query({ data: userData })
      .query({ room: "room" })
      .expect(200);

    const token = response.body.token;
    expect(token.length).toEqual(32);
    expect(/[0-9a-f]{16}/.test(token)).toBeTruthy();
  });

  it("POST /api/v1/access/:token", async () => {
    const verifyReq = await request(app).post(`/api/v1/access/${response.body.token}`);
    expect(verifyReq.body.state).toBe("authorized");
    expect(verifyReq.body.data).toStrictEqual(userData);
  });
});

describe("verify route, if user data is empty", () => {
  let response;

  it("GET /api/v1/access", async () => {
    response = await request(app)
      .get("/api/v1/access")
      .query({ room: "room" })
      .expect(200);

    const token = response.body.token;
    expect(token.length).toEqual(32);
    expect(/[0-9a-f]{16}/.test(token)).toBeTruthy();
  });

  it("POST /api/v1/access/:token", async () => {
    const verifyReq = await request(app).post(`/api/v1/access/${response.body.token}`);
    expect(verifyReq.body.state).toBe("authorized");
    expect(verifyReq.body.data).toStrictEqual("");
  });
});

describe("verify route, when request failed", () => {
  let response;

  it("GET /api/v1/access", async () => {
    response = await request(app)
      .get("/api/v1/access")
      .expect(400);

    expect(response.body.message).toEqual("invaild room");
  });

  it("POST /api/v1/access/:token", async () => {
    const verifyReq = await request(app).post(`/api/v1/access/wrong-token`);
    expect(verifyReq.body.state).toBe("unauthorized");
    expect(verifyReq.body.data).toBe(undefined);
  });
});