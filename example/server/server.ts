import { WebSocketServer } from "ws";
import { WsClient } from "./interface/client.trait.js";
import { IServer, RoomState } from "./interface/server.js";

export class WsServer extends WebSocketServer implements IServer {
  public shareObj = {
    rooms: new Map<string, WsClient[]>(),
    userTable: new Map<string, WsClient>(),
    forwardTable: new Map<string, string>(),
    textChannel: new Map<string, string[]>(),
  };


  public defineInitRoom(rooms: string[]) {
    for (const room of rooms) {
      this.shareObj.rooms.set(room, []);
    }
  }

  public listRoomState(roomId: string = "LISTALL") {
    const rooms = this.shareObj.rooms;

    let result: RoomState[] = [];
    const clientIter = (client: WsClient) => ({
      etag: client.etag ?? "",
      username: client.username ?? "",
    });

    if (roomId === "LISTALL") {
      for (const [room, clients] of rooms.entries()) {
        result.push({
          roomId: room,
          clients: clients.map(clientIter),
        });
      }
      return result;
    }

    const roomRef = rooms.get(roomId);
    if (!roomRef) return [];

    result.push({
      roomId,
      clients: roomRef.map(clientIter),
    });
    return result;
  }

  public enterRoom(roomId: string, client: WsClient) {
    const rooms = this.shareObj.rooms;
    if (rooms.has(roomId)) {
      rooms.get(roomId)?.push(client);
    } else {
      rooms.set(roomId, [client]);
      console.log(rooms);
    }
  }

  public exitRoom(roomId: string, client: WsClient) {
    const rooms = this.shareObj.rooms;
    const roomRef = rooms.get(roomId);

    if (!roomRef) return;

    const offset = roomRef.indexOf(client);
    if (offset !== -1) {
      roomRef.splice(offset, 1);
    }
  }

  public userRegister(etag: string, client: WsClient) {
    const userTable = this.shareObj.userTable;

    userTable.set(etag, client);
    client.once("close", () => {
      userTable.delete(client.etag ?? "");
    });
  }

  public broadcast(event: string, data: any) {
    this.clients.forEach((e) => {
      (e as WsClient).reply(event, data);
    });
  }
}
