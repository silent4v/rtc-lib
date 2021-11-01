import { randomTag } from "./utils.js";
import { SocketAdapter } from "./socket-adapter.js";
import { ConnectContext, ConnectRequest, IceSwitchInfo } from "./types.js";
import { iceConf } from "./config.js";

export class RemoteManager {
  public connections = new Map<string, ConnectContext>();
  public signalChannel: SocketAdapter;
  public mediaState = false;
  private localStream_: MediaStream = new MediaStream;
  private connectGuard_: Function = (who) => { console.log(who); return true; };
  constructor(sock: SocketAdapter) {
    this.signalChannel = sock;
    this.recv();
  }

  public async openDevice() {
    try {
      this.mediaState = true;
      this.localStream_ = await navigator.mediaDevices.getUserMedia({ audio: true });
      return this.localStream_;
    } catch (e) {
      console.error("Can't open media device: ", e);
      return false;
    }
  }

  public async toggleDevice() {
    if (this.localStream_) {
      this.mediaState = !this.mediaState;
      this.localStream_.getTracks().forEach(track => {
        track.enabled = this.mediaState;
      });
    }
  }

  public async call(etag: string) {
    const replyToken = randomTag();
    const pc = new RTCPeerConnection(iceConf);
    await this.rtcEventHooks(pc, etag);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    /* wait for response */
    this.signalChannel.once<ConnectRequest>(replyToken, async ({ detail }) => {
      const [{ sdp, etag }] = detail;
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      console.log("recv response");
    });
    this.signalChannel.sendout("rtc::request", { sdp: offer, etag }, replyToken);
    return pc;
  }

  public toggleMuted(etag) {
    const user = this.connections.get(etag);
    if (user) {
      user.audio.muted = !user.audio.muted;
    }
  }

  public async recv() {
    this.signalChannel.on<ConnectRequest>("rtc::request", async ({ detail }) => {
      const [{ sdp, etag }, replyToken] = detail;
      if (this.connectGuard_({ sdp, etag })) {
        const pc = new RTCPeerConnection(iceConf);
        await this.rtcEventHooks(pc, etag);

        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        (window as any).testPC = pc
        this.signalChannel.sendout("rtc::response", { sdp: answer, etag }, replyToken);
      }
    });

    this.signalChannel.on<IceSwitchInfo>("rtc::ice_switch", async ({ detail }) => {
      const [{ candidate, etag }] = detail;
      const connect = this.connections.get(etag);
      if (connect) {
        connect.pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });
  }

  public setGuard(fn: Function) {
    if (typeof fn === "function")
      this.connectGuard_ = fn;
  }

  public async rtcEventHooks(pc: RTCPeerConnection, remoteEtag: string) {
    this.connections.set(remoteEtag, { pc, audio: new Audio });

    /* Test Stream */
    if (this.mediaState && this.localStream_) {
      console.log("ADD TRACK");
      this.localStream_.getTracks().forEach(track => pc.addTrack(track));
    }

    pc.ontrack = (e) => {
      const user = this.connections.get(remoteEtag);
      if (user) {
        const stream = new MediaStream;
        stream.addTrack(e.track);
        user.audio.srcObject = stream;
        user.audio.play();
      }
    }

    pc.onconnectionstatechange = () => {
      console.log("pc.connectionState", pc.connectionState)
      switch (pc.connectionState) {
        case "connected":
          // The connection has become fully connected
          this.signalChannel.dispatchEvent("remoteConnected", null);
          break;

        case "disconnected":
        case "failed":
        case "closed":
          this.connections.delete(remoteEtag);
          this.signalChannel.dispatchEvent("remoteClose", this.connections);
      }
    }

    pc.onicecandidate = event => {
      if (event && event.candidate) {
        this.signalChannel.sendout("rtc::ice_switch", event.candidate, remoteEtag);
      }
    }
  }
}