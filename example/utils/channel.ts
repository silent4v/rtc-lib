import { SetManager } from "./set-manager.js";

type ChannelState = { 
  name: string,
  clients: string[],
  type: "$channel"
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
    const basic = super.list(channelName);
    return basic.map(({name, clients}) => ({
      name, 
      clients,
      type: "$channel"
    }));
  }
}

export const channelRef = Channel.instance;