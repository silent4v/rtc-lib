import { SetManager } from "./set-manager";
import { Server } from "./server";

type RoomState = {
  name: string,
  clients: string[],
  type: "$room"
}

export class Room extends SetManager {
  static instance = new Room;
  public tokenMatchTable = new Map<string, string>();

  public setExpireToken(token: string, room: string, expireTime = 600) {
    this.tokenMatchTable.set(token, room);
    return setTimeout(() => {
      this.tokenMatchTable.delete(token);
    }, expireTime * 1000);
  }

  public useToken(token) {
    if(this.tokenMatchTable.has(token)) {
      const room = this.tokenMatchTable.get(token);
      this.tokenMatchTable.delete(token);
      return room as string;
    }
    return null;
  }

  public enter(sid: string, roomName: string) {
    const user = Server.users_.get(sid);
    if (user) {
      user.exit();
      this.update(roomName).get(roomName)!.add(sid);
    }
    return this;
  }

  public list(channelName: string): RoomState[] {
    const basic = super.list(channelName);
    return basic.map(({name, clients}) => ({
      name, 
      clients,
      type: "$room"
    }));
  }
}

export const roomRef = Room.instance;