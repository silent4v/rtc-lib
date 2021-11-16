import type { EventCallback, EventTypes, Message } from "./types.js";
import { Connector } from "./connector.js";
import { success, warning } from "./log.js";

/** @class */
export class Messenger {
  public textChannel = new Set<string>();
  public inbox: Message[] = [];
  public timestamp: number = -1;
  public cursor = 0;
  private reserve_: number = 1000;
  private highPressure_: number = 700;

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

  /**
   * @description
   * Clear all currently subscribed channels, only keep the channel subscriptions with current parameters
   */
  public async only(textChannel: string) {
    for (const ch of this.textChannel) {
      await this.signal.request<boolean>("text::unsubscribe", ch);
    }
    this.textChannel.clear();
    await this.subscribe(textChannel);
  }

  /**
   * @description
   * Add a channel to the tracking list, if other users leave a message on that channel,
   * inbox will receive the message
   */
  public async subscribe(textChannel: string) {
    const [done] = await this.signal.request<boolean>("text::subscribe", textChannel);
    if (done) this.textChannel.add(textChannel);
  }

  /**
   * @description
   * Reomve a channel from the tracking list.
   */
  public async unsubscribe(textChannel: string) {
    const [done] = await this.signal.request<boolean>("text::unsubscribe", textChannel);
    if (done) this.textChannel.delete(textChannel);
  }

  /**
   * @description
   * Push a message to a specific channel, can use await to ensure the order of the messages
   * @example
   * // This does not guarantee that the message delivery order is `ch01`, `ch02`, `ch03`
   * this.talk("channel01", "some message");
   * this.talk("channel02", "some message");
   * this.talk("channel03", "some message");
   * // This can guarantee the order of sending the messages
   * await this.talk("channel01", "some message");
   * await this.talk("channel02", "some message");
   * await this.talk("channel03", "some message");
   */
  public talk(textChannel: string, message: string) {
    return this.signal.request("text::message", { roomId: textChannel, message });
  }

  /**
   * @description
   * define a channel notification event, when the subscribed channel receives a message, invoke event.
   */
  public notify(textChannel: string, callback: EventCallback<Message>) {
    this.signal.on(`notify::${textChannel}` as EventTypes, callback);
  }
  
  /**
   * @description
   * remove a channel notification event.
   */
  public cancelNotify(textChannel: string) {
    this.signal.events.clear(`notify::${textChannel}`);
  }

  /**
   * @description
   * This method accepts two parameters, the first parameter defines the maximum capacity of the inbox
   * second parameter defines the highPressure value, when messages size more then highPressure value,
   * dispatch `text::highPressure` event.
   */
  public reserve(size: number, highPressure = -1) {
    if (size < 10 || size > 10000) {
      throw new Error("size just allow range [10, 10000] ");
    }
    this.reserve_ = size;
    this.highPressure_ = (size / 2) > highPressure ? size / 2 : highPressure;
  }

  /**
   * @description
   * Remove all inbox messages
   */
  public truncate() {
    this.inbox = [];
    this.cursor = 0;
  }

  /**
   * @description
   * Take the message in the inbox, and forward the cursor.
   * Note that, this action will not remove the messages in the inbox.
   */
  public read(size: number) {
    const begin = this.cursor;
    this.cursor += size;
    if (this.cursor > this.inbox.length)
      this.cursor = this.inbox.length;
    this.timestamp = Date.now();
    return this.inbox.slice(begin, this.cursor);
  }
}