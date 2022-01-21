import { Client, Server, roomRef, } from "../utils";

const dd = require("debug")("room");

/**
 * @event request::room::follow
 *
 * @description
 * Receive a token, if the token refers to a room
 * make the client subscribe to and enter the room
 */
export const onFollow = (client: Client, server: Server) =>
  (token: string, _replyToken: string) => {
    const room = client.useToken(token);
    client.sendout(_replyToken, !!room ? 1 : 0);
    dd("token: %s", token);
  }

/**
 * @event request::room::enter
 *
 * @description
 * Let the client leave the current room and enter the specified room
 * if the specified room does not exist, create a new room
 */
export const onEnter = (client: Client, server: Server) =>
  (roomName: string, _replyToken: string) => {
    if (client.currentRoom === roomName) {
      client.sendout(_replyToken, 0);
      return;
    }
    const from = client.currentRoom;
    const to = roomName;
    client.enter(roomName);
    client.sendout(_replyToken, roomName);

    server.broadcast("room::diff", {
      sessionId: client.sessionId,
      username: client.username,
      from,
      to
    });
    dd("enter %s room", roomName);
  }

/**
 * @event request::room::exit
 * 
 * @description
 * Let the client leave the current room
 */
export const onExit = (client: Client, server: Server) =>
  (_, _replyToken: string) => {
    const from = client.currentRoom;
    const to = "$NONE";

    client.exit();
    client.sendout(_replyToken, 1);
    server.broadcast("room::diff", {
      sessionId: client.sessionId,
      username: client.username,
      from,
      to
    });
    dd("%s current at %s", client.username, client.currentRoom);
  }

/**
 * @event request::room::list
 * 
 * @description
 * Receive a room name that lists the information for the specified room.
 * if the room name is `$DEFAULT`, lists all rooms.
 */
export const onList = (client: Client, server: Server) =>
  (roomName: string, _replyToken: string) => {
    const lists = roomRef.list(roomName);
    client.sendout(_replyToken, lists);
    dd("list %s information", roomName);
  }

export const RoomEventRegistry = (c: Client, s: Server) => {
  c.on("request::room::follow", onFollow(c, s));
  c.on("request::room::enter", onEnter(c, s));
  c.on("request::room::exit", onExit(c, s));
  c.on("request::room::list", onList(c, s));
}
