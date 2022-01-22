import { Channel } from "../utils/channel";

const randStr = () => Math.random().toString(36);

describe("channel utils test", () => {
  it("check users subscribe behavior", () => {
    const channel = new Channel;
    /* ch1 */
    channel.subscribe("user1", "ch1");
    channel.subscribe("user2", "ch1");
    channel.subscribe("user3", "ch1");
    channel.subscribe("user4", "ch1");

    /* ch2 */
    channel.subscribe("user2", "ch2");
    channel.subscribe("user3", "ch2");
    channel.subscribe("user5", "ch2");

    /* ch3 */
    channel.subscribe("user1", "ch3");
    channel.subscribe("user3", "ch3");
    channel.subscribe("user5", "ch3");

    expect([...channel.container.get("ch1")!.values()]).toStrictEqual(["user1", "user2", "user3", "user4"]);
    expect([...channel.container.get("ch2")!.values()]).toStrictEqual(["user2", "user3", "user5"]);
    expect([...channel.container.get("ch3")!.values()]).toStrictEqual(["user1", "user3", "user5"]);
  });

  it("check users unsubscribe behavior", () => {
    const channel = new Channel;

    /* ch1 */
    channel.subscribe("user1", "ch1")
      .subscribe("user2", "ch1")
      .unsubscribe("user2", "ch1")
      .subscribe("user3", "ch1")
      .subscribe("user4", "ch1")

    /* ch2 */
    channel.subscribe("user2", "ch2")
      .subscribe("user3", "ch2")
      .subscribe("user5", "ch2")

    /* ch3 */
    channel.subscribe("user1", "ch3")
      .subscribe("user3", "ch3")
      .subscribe("user5", "ch3")
      .unsubscribe("user5", "ch3")
      .unsubscribe("user6", "ch3")

    expect([...channel.container.get("ch1")!.values()]).toStrictEqual(["user1", "user3", "user4"]);
    expect([...channel.container.get("ch2")!.values()]).toStrictEqual(["user2", "user3", "user5"]);
    expect([...channel.container.get("ch3")!.values()]).toStrictEqual(["user1", "user3"]);
  });

  it("check append channel", () => {
    const channel = new Channel;

    expect(channel.list()).toStrictEqual([]);

    channel.append("c1");
    channel.append("c2");
    channel.append("c3");
    channel.append("c4");

    expect(channel.list()).toStrictEqual([
      { name: "c1", clients: [], type: "$channel" },
      { name: "c2", clients: [], type: "$channel" },
      { name: "c3", clients: [], type: "$channel" },
      { name: "c4", clients: [], type: "$channel" },
    ])
  });

  it("if user subscribe channel, check user number of channel ", () => {
    const channel = new Channel;

    expect(channel.list()).toStrictEqual([]);
    for (let i = 0; i < 10; ++i) channel.subscribe(randStr(), "ch1");
    for (let i = 0; i < 5; ++i) channel.subscribe(randStr(), "ch2");
    for (let i = 0; i < 8; ++i) channel.subscribe(randStr(), "ch3");
    for (let i = 0; i < 13; ++i) channel.subscribe(randStr(), "ch4");
    for (let i = 0; i < 26; ++i) channel.subscribe(randStr(), "ch5");
    expect(channel.container.get("ch1")?.size).toBe(10);
    expect(channel.container.get("ch2")?.size).toBe(5);
    expect(channel.container.get("ch3")?.size).toBe(8);
    expect(channel.container.get("ch4")?.size).toBe(13);
    expect(channel.container.get("ch5")?.size).toBe(26);
  });

  it("simulate a user sub/unsub channels", () => {
    const channel = new Channel;
    channel
      /* ch1 */
      .subscribe("u01", "c1")
      .subscribe("u13", "c1")
      .subscribe("u16", "c1")
      .subscribe("u18", "c1")
      .subscribe("u64", "c1")
      .subscribe("u24", "c1")
      /* ch2 */
      .subscribe("u45", "c2")
      .subscribe("u48", "c2")
      .subscribe("u04", "c2")
      .subscribe("u40", "c2")
      .subscribe("u64", "c2")
      .subscribe("u64", "c2")
      /* ch3 */
      .subscribe("u10", "c3")
      .subscribe("u26", "c3")
      .subscribe("u87", "c3")
      .subscribe("u105", "c3");

    expect(channel.list()).toStrictEqual([
      {
        name: "c1",
        clients: ["u01", "u13", "u16", "u18", "u64", "u24"],
        type: "$channel"
      },
      {
        name: "c2",
        clients: ["u45", "u48", "u04", "u40", "u64"],
        type: "$channel"
      },
      {
        name: "c3",
        clients: ["u10", "u26", "u87", "u105"],
        type: "$channel"
      },
    ]);

    channel.unsubscribe("u01", "c1")
      .unsubscribe("u13", "c1")
      .unsubscribe("u64", "c1")
      .unsubscribe("u999", "c1")
      .unsubscribe("u45", "c2")
      .unsubscribe("u04", "c2")
      .unsubscribe("u10", "c3")
      .unsubscribe("u26", "c3")
      .unsubscribe("u87", "c3")
      .unsubscribe("u105", "c3");

    expect(channel.list()).toStrictEqual([
      {
        name: "c1",
        clients: ["u16", "u18", "u24"],
        type: "$channel"
      },
      {
        name: "c2",
        clients: ["u48", "u40", "u64"],
        type: "$channel"
      },
      {
        name: "c3",
        clients: [],
        type: "$channel"
      },
    ]);
  });
});