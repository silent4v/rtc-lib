import { WsClient } from "./client.trait.js";

export interface IServer {
  listRoomState(roomId: string);
  enterRoom(roomId: string, client: WsClient);
  exitRoom(roomId: string, client: WsClient);
  userRegister(etag: string, client: WsClient);
  broadcast(event: string, payload: any);
}

export type RoomState = {
  roomId: string;
  clients: {
    etag: string;
    username: string;
  }[];
};
