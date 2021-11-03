import { randomTag } from "./utils.js";
import { Connector } from "./connector.js"
import { ConnectContext, ConnectRequest, IceSwitchInfo } from "./types.js";
import { iceConf } from "./config.js";

export class Streamings {
  public connections = new Map<string, ConnectContext>();
  public deviceOpened = false;
  private localDevice_: MediaStream | null = null;
  private connectGuard_: Function = (who) => { console.log(who); return true; };

  constructor(public signal: Connector) {
    this.recv();
  }

  public async openDevice(constraints: MediaStreamConstraints) {
    try {
      this.deviceOpened = true;
      this.localDevice_ = await navigator.mediaDevices.getUserMedia(constraints);
      return this.localDevice_;
    } catch (e) {
      console.error("Can't open media device: ", e);
      return false;
    }
  }

  public async toggleDevice() {
    if (this.localDevice_) {
      this.deviceOpened = !this.deviceOpened;
      this.localDevice_.getTracks().forEach(track => {
        track.enabled = this.deviceOpened;
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
    this.signal.once<ConnectRequest>(replyToken, async (detail) => {
      const { sdp, etag } = detail;
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      console.log("recv response");
    });
    this.signal.sendout("rtc::request", { sdp: offer, etag }, replyToken);
    return pc;
  }

  public toggleMuted(etag) {
    const user = this.connections.get(etag);
    if (user) {
      user.audio.muted = !user.audio.muted;
    }
  }

  public async recv() {
    this.signal.on<ConnectRequest>("rtc::request", async (detail, replyToken) => {
      const { sdp, etag } = detail;
      if (this.connectGuard_({ sdp, etag })) {
        const pc = new RTCPeerConnection(iceConf);
        await this.rtcEventHooks(pc, etag);

        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        (window as any).testPC = pc
        this.signal.sendout("rtc::response", { sdp: answer, etag }, replyToken);
      }
    });

    this.signal.on<IceSwitchInfo>("rtc::ice_switch", async (detail) => {
      const { candidate, etag } = detail;
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
    if (this.deviceOpened && this.localDevice_) {
      console.log("ADD TRACK");
      this.localDevice_.getTracks().forEach(track => pc.addTrack(track));
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
          this.signal.dispatch("remoteConnected", null);
          break;

        case "disconnected":
        case "failed":
        case "closed":
          this.connections.delete(remoteEtag);
          this.signal.dispatch("remoteClose", this.connections);
      }
    }

    pc.onicecandidate = event => {
      if (event && event.candidate) {
        this.signal.sendout("rtc::ice_switch", event.candidate, remoteEtag);
      }
    }
  }
}