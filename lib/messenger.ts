import type { Message } from "./types.js";
import { Connector } from "./connector.js";
import { success, warning } from "./log.js";

export class Messenger {
  public textChannel = new Set<string>();
  public mediaChannel: string = "";
  public inbox: Message[] = []
  private reserve_: number = 1000;
  private highPressure_: number = 700;
  public cursor = 0;

  constructor(public signal: Connector) {
    this.signal.on<Message>("text::message", (data) => {
      const { roomId, message, who, at } = data;
      this.signal.dispatch(roomId, { message, who, at });
      this.inbox.push(data);

      if (this.inbox.length === this.highPressure_) {
        this.signal.dispatch("text::highPressure", this.inbox.length);
        warning("Messenger::highPressure", { max: this.reserve_, now: this.inbox.length });
      }

      if (this.inbox.length > this.reserve_) {
        this.signal.dispatch("text::remove", this.inbox.shift());
        warning("Messenger::remove", "Inbox is full");
      }

      success("Messenger::recv", data);
    })
  }

  public async only(textRoomId: string) {
    this.textChannel.clear();
    await this.subscribe(textRoomId);
  }

  public async subscribe(textRoomId: string) {
    const [done] = await this.signal.request<boolean>("text::subscribe", textRoomId);
    if (done) this.textChannel.add(textRoomId);
  }

  public async unsubscribe(textRoomId: string) {
    const [done] = await this.signal.request<boolean>("text::unsubscribe", textRoomId);
    if (done) this.textChannel.delete(textRoomId);
  }

  public talk(textRoomId: string, message: string) {
    return this.signal.sendout("text::message", { roomId: textRoomId, message });
  }

  public reserve(size: number, highPressure = -1) {
    if (size < 100 || size > 10000) {
      throw new Error("size just allow range [100, 10000] ");
    }
    this.reserve_ = size;
    this.highPressure_ = (size / 2) > highPressure ? size / 2 : highPressure;
  }

  public truncate() {
    this.inbox = [];
  }

  public read(size: number) {
    const begin = this.cursor;
    this.cursor += size;
    return this.inbox.splice(begin, size);
  }
}