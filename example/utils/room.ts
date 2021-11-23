import { SetManager } from "./set-manager.js";
import { userTable } from "./server.js";

type RoomState = { 
  name: string,
  clients: string[],
  type: "$room"
}

export class Room extends SetManager {
  static instance = new Room;

  public enter(sid: string, roomName: string) {
    const user = userTable.get(sid);
    if (user) {
      user.exit();
      this.update(roomName).get(roomName)!.add(sid);
    }
    return this;
  }

  public list(channelName: string = "$LISTALL"): RoomState[] {
    const basic = super.list(channelName);
    return basic.map(({name, clients}) => ({
      name, 
      clients,
      type: "$room"
    }));
  }
}

export const roomRef = Room.instance;