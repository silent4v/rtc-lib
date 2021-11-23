import { SetManager } from "./set-manager.js";

type ChannelState = { 
  channelName: string,
  clients: string[]
}

export class Channel extends SetManager {
  static instance = new Channel;

  public subscribe(sid: string, channelName: string) {
    this.update(channelName).get(channelName)!.add(sid);
    return this;
  }

  public unsubscribe(sid: string, channelName: string) {
    const ch = this.update(channelName).get(channelName);
    if (ch) ch.delete(sid);
    return this;
  }

  public list(channelName: string = "$LISTALL"): ChannelState[] {
    if (channelName === "$LISTALL") {
      return [...this.container.entries()].map(([channelName, clients]) => ({ channelName, clients: [...clients.values()] }));
    }

    return [{
      channelName,
      clients: [...this.container.get(channelName)?.values() ?? []]
    }];
  }

}

export const channelRef = Channel.instance;