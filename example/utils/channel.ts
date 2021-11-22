type ChannelState = {
  channelName: string,
  clients: string[]
}

export class Channel {
  static channel = new Channel;

  public map = new Map<string, Set<string>>();
  public subscribe(sid: string, channelName: string) {
    this.update(channelName).get(channelName)!.add(sid);
    return this;
  }

  public unsubscribe(sid: string, channelName: string) {
    const ch = this.update(channelName).get(channelName);
    if (ch) ch.delete(sid);
    return this;
  }

  public append(channelName: string) {
    this.update(channelName);
    return this;
  }

  public list(channelName: string = "$LISTALL"): ChannelState[] {
    if (channelName === "$LISTALL") {
      return [...this.map.entries()].map(([channelName, clients]) => ({ channelName, clients: [...clients.values()] }));
    }

    return [{
      channelName,
      clients: [...this.map.get(channelName)?.values() ?? []]
    }];
  }

  public update(channelName: string) {
    if (!this.map.has(channelName)) {
      this.map.set(channelName, new Set<string>());
    }

    return this.map;
  }
}

export const channelRef = Channel.channel;