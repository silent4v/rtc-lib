import { SetManager } from "./set-manager.js";
import { userTable } from "./server.js";

type RoomState = {
  roomName: string,
  clients: string[]
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
}

export const roomRef = Room.instance;