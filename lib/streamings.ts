import { randomTag } from "./utils.js";
import { Connector } from "./connector.js"
import { ConnectContext, ConnectRequest, IceSwitchInfo, RTCGuard } from "./types.js";
import { iceConf } from "./config.js";
import { info, warning } from "./log.js";

export class Streamings {
  public connections = new Map<string, ConnectContext>();
  public streamEnabled = false;
  private device_: MediaStream | null = null;
  private connectGuard_: Function = (who) => { console.log(who); return true; };

  constructor(public signal: Connector) {
    this.recv();
  }

  public openDevice(media: MediaStream) {
    this.device_ = media;
  }

  public get state() {
    const remotes: {
      RTCnativeRef: RTCPeerConnection;
      connectionState: string;
      source: HTMLAudioElement;
      muted: boolean
    }[] = [];
    this.connections.forEach( user => {
      remotes.push({
        RTCnativeRef: user.pc,
        connectionState: user.pc.connectionState,
        source: user.audio,
        muted: user.audio.muted,
      });
    })
    return {
      self: { device: this.device_, enable: this.streamEnabled },
      remotes
    }
  }

  public toggleDevice() {
    if (this.device_) {
      this.streamEnabled = !this.streamEnabled;
      this.device_.getTracks().forEach(track => {
        track.enabled = this.streamEnabled;
      });
    }
  }

  public toggleMuted(etag) {
    const user = this.connections.get(etag);
    if (user) {
      user.audio.muted = !user.audio.muted;
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
      const { sdp } = detail;
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      this.signal.dispatch("rtc::recvRes", pc);
    });
    this.signal.sendout("rtc::request", { sdp: offer, etag }, replyToken);
    return pc;
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
        this.signal.dispatch("rtc::recvReq", pc);
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

  public setGuard(fn: RTCGuard) {
    if (typeof fn === "function")
      this.connectGuard_ = fn;
  }

  public async rtcEventHooks(pc: RTCPeerConnection, remoteEtag: string) {
    this.connections.set(remoteEtag, { pc, audio: new Audio });

    /* Add stream */
    if (this.streamEnabled && this.device_) {
      warning("RTC::Track", "ADD TRACK");
      this.device_.getTracks().forEach(track => pc.addTrack(track));
    }

    /* When Recv remote stream */
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
      info("RTC::ConnectionState", pc.connectionState)
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
        info("RTC::Candidate", pc.connectionState)
        this.signal.sendout("rtc::ice_switch", event.candidate, remoteEtag);
      }
    }
  }
}