export function randomTag() {
  const timestamp = Date.now().toString(16);
  const hex = ((Math.random() * 0xfffff) | 0).toString(16).padStart(6, "0");
  return timestamp + hex;
}

export function randomString(length = 16, charset = alphanum) {
  const pick = (range: number) => charset[(Math.random() * range) | 0];
  const result: string[] = [];
  for (let i = 0; i < length; ++i) {
    result.push(pick(charset.length));
  }
  return result.join("");
}

export function delay(ms: number) {
  return new Promise((done, _) => {
    setTimeout(done, ms);
  })
}

export function waiting(sock: WebSocket) {
  return new Promise<boolean>((done, _) => {
    sock.onopen = () => done(true);
    sock.onclose = () => done(false);
    if (sock.readyState === WebSocket.OPEN) done(true);
    if (sock.readyState === WebSocket.CLOSED) done(false);
  });
}

export const letters = [
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
];

export const numbers = [..."0123456789"];

export const alphanum = [...letters, ...numbers];
