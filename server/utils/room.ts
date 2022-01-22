import { SetManager } from "./set-manager";
import { Server } from "./server";

export type RoomState = {
  name: string,
  clients: string[],
  type: "$room"
}

export type UserData = {
  room: string;
  userData: any;
  permission
}

export class Room extends SetManager {
  static instance = new Room;
  public tokenMatchTable = new Map<string, UserData>();

  public setExpireToken(token: string, data: UserData, expireTime = 600) {
    this.tokenMatchTable.set(token, data);
    return setTimeout(() => {
      this.tokenMatchTable.delete(token);
    }, expireTime * 1000);
  }

  public takeMatchData(token) {
    if (this.tokenMatchTable.has(token)) {
      const data = this.tokenMatchTable.get(token) as UserData;
      this.tokenMatchTable.delete(token);
      return data;
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
    return basic.map(({ name, clients }) => ({
      name,
      clients,
      type: "$room"
    }));
  }
}

export const roomRef = Room.instance;