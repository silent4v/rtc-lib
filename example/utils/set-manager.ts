type StateList = {
  name: string,
  clients: string[],
}

export class SetManager {
  public container = new Map<string, Set<string>>();

  public append(key: string) {
    this.update(key);
    return this;
  }

  public update(key: string) {
    if (!this.container.has(key)) {
      this.container.set(key, new Set<string>());
    }
    return this.container;
  }

  public list(name = "$LISTALL"): StateList[] {
    if (name === "$LISTALL") {
      const pairs = [...this.container.entries()];
      return pairs.map(([name, clients]) => ({ name, clients: [...clients.values()] }));
    }

    return [{
      name,
      clients: [...this.container.get(name)?.values() ?? []]
    }];
  }

  public refresh() {
    const keys = [...this.container.keys()];
    keys.forEach(k => {
      if (this.container.get(k)!.size <= 0)
        this.container.delete(k);
    });
  }
}