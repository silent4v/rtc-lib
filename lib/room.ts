import { Connector } from "./connector";

export class Room {
  public textChannel: string[] = [];
  public mediaChannel: string = "";
  public textCursor = -1;

  constructor(public signal: Connector) {
  }

  public subscribeTextCh(textRoomId: string) {

  }

  public unsubscribeTextCh(textRoomId: string) {

  }

  public enter(roomId: string) {
    this.signal.request("room::enter", roomId);
  }

  public exit(roomId: string) {
    this.signal.request("room::exit", roomId);
  }

  public list(roomId: string) {
    this.signal.request("room::list", roomId);
  }
}