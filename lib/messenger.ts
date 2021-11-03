import type { EventCallback, Message } from "./types.js";
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
      this.signal.dispatch(`notify::${roomId}`, { message, who, at });
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

  public async only(textChannel: string) {
    for (const ch of this.textChannel) {
      await this.signal.request<boolean>("text::unsubscribe", ch);
    }
    this.textChannel.clear();
    await this.subscribe(textChannel);
  }

  public async subscribe(textChannel: string) {
    const [done] = await this.signal.request<boolean>("text::subscribe", textChannel);
    if (done) this.textChannel.add(textChannel);
  }

  public async unsubscribe(textChannel: string) {
    const [done] = await this.signal.request<boolean>("text::unsubscribe", textChannel);
    if (done) this.textChannel.delete(textChannel);
  }

  public talk(textChannel: string, message: string) {
    return this.signal.request("text::message", { roomId: textChannel, message });
  }

  public notify(textChannel: string, callback: EventCallback<Message>) {
    this.signal.on(`notify::${textChannel}`, callback);
  }

  public cancelNotify(textChannel: string) {
    this.signal.events.clear(`notify::${textChannel}`);
  }

  public reserve(size: number, highPressure = -1) {
    if (size < 10 || size > 10000) {
      throw new Error("size just allow range [10, 10000] ");
    }
    this.reserve_ = size;
    this.highPressure_ = (size / 2) > highPressure ? size / 2 : highPressure;
  }

  public truncate() {
    this.inbox = [];
    this.cursor = 0;
  }

  public read(size: number) {
    const begin = this.cursor;
    this.cursor += size;
    if (this.cursor > this.inbox.length)
      this.cursor = this.inbox.length;
    return this.inbox.slice(begin, this.cursor);
  }
}