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

  it("GET /api/v1/access", async () => {
    response = await request(app)
      .get("/api/v1/access")
      .query({ data: JSON.stringify(userData) })
      .expect(200);

    const token = response.body.token;
    expect(token.length).toEqual(32);
    expect(/[0-9a-f]{16}/.test(token)).toBeTruthy();
  });

  it("POST /api/v1/access/:token", async () => {
    const verifyRes = await request(app).post(`/api/v1/access/${response.body.token}`);
    expect(verifyRes.body.state).toBe("authorized");
    expect(verifyRes.body.data).toStrictEqual(userData);
  });
});

describe("verify route, if user data is string", () => {
  let response;
  const userData = "STRING";

  it("GET /api/v1/access", async () => {
    response = await request(app)
      .get("/api/v1/access")
      .query({ data: userData })
      .expect(200);

    const token = response.body.token;
    expect(token.length).toEqual(32);
    expect(/[0-9a-f]{16}/.test(token)).toBeTruthy();
  });

  it("POST /api/v1/access/:token", async () => {
    const verifyRes = await request(app).post(`/api/v1/access/${response.body.token}`);
    expect(verifyRes.body.state).toBe("authorized");
    expect(verifyRes.body.data).toStrictEqual(userData);
  });
});

describe("verify route, if user data is empty", () => {
  let response;

  it("GET /api/v1/access", async () => {
    response = await request(app)
      .get("/api/v1/access")
      .expect(200);

    const token = response.body.token;
    expect(token.length).toEqual(32);
    expect(/[0-9a-f]{16}/.test(token)).toBeTruthy();
  });

  it("POST /api/v1/access/:token", async () => {
    const verifyRes = await request(app).post(`/api/v1/access/${response.body.token}`);
    expect(verifyRes.body.state).toBe("authorized");
    expect(verifyRes.body.data).toStrictEqual("");
  });
});