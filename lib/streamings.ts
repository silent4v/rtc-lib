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
    this.connections.forEach(user => {
      remotes.push({
        RTCnativeRef: user.RTCRef,
        connectionState: user.RTCRef.connectionState,
        source: user.audio,
        muted: user.audio.muted,
      });
    })
    return {
      self: { device: this.device_, enable: this.streamEnabled },
      remotes
    }
  }

  private async recv() {
    this.signal.on<ConnectRequest>("rtc::request", async (detail, replyToken) => {
      const { sdp, sessionId } = detail;
      if (this.connectGuard_({ sdp, sessionId })) {
        const RTCRef = new RTCPeerConnection(iceConf);
        await this.rtcEventHooks(RTCRef, sessionId);
        await RTCRef.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await RTCRef.createAnswer();
        await RTCRef.setLocalDescription(answer);
        info("RTC::RequestFrom", { RTCPeer: RTCRef, sessionId });
        this.signal.dispatch("rtc::recvReq", { RTCPeer: RTCRef, sessionId });
        this.signal.sendout("rtc::response", { sdp: answer, sessionId }, replyToken);
      }
    });

    this.signal.on<IceSwitchInfo>("rtc::ice_switch", async (detail) => {
      const { candidate, sessionId } = detail;
      const connect = this.connections.get(sessionId);
      if (connect) {
        info("RTC::IceSwitchInfo", { candidate, source: sessionId });
        connect.RTCRef.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });
  }

  public async call(sessionId: string) {
    const replyToken = randomTag();
    const RTCRef = new RTCPeerConnection(iceConf);
    await this.rtcEventHooks(RTCRef, sessionId);

    const offer = await RTCRef.createOffer();
    await RTCRef.setLocalDescription(offer);

    /* wait for response */
    this.signal.once<ConnectRequest>(replyToken, async (detail) => {
      const { sdp } = detail;
      await RTCRef.setRemoteDescription(new RTCSessionDescription(sdp));
      info("RTC::ResponseFrom", { RTCPeer: RTCRef, sessionId });
      this.signal.dispatch("rtc::recvRes", { RTCPeer: RTCRef, sessionId });
    });
    this.signal.sendout("rtc::request", { sdp: offer, sessionId }, replyToken);
    return RTCRef;
  }

  private async rtcEventHooks(RTCRef: RTCPeerConnection, remoteSessionId: string) {
    const channel = RTCRef.createDataChannel(this.signal.username ?? "#anonymous");

    /* Add stream */
    if (this.streamEnabled && this.device_) {
      warning("RTC::Track", "ADD TRACK");
      this.device_.getTracks().forEach(track => RTCRef.addTrack(track));
    }

    /* When Recv remote stream */
    RTCRef.ontrack = (e) => {
      const user = this.connections.get(remoteSessionId);
      if (user) {
        const stream = new MediaStream;
        stream.addTrack(e.track);
        user.audio.srcObject = stream;
        user.audio.play();
      }
    }

    RTCRef.onconnectionstatechange = () => {
      info("RTC::ConnectionState", `${RTCRef.connectionState}: ${remoteSessionId}`);
      switch (RTCRef.connectionState) {
        case "connected":
          // The connection has become fully connected
          this.signal.dispatch("remoteConnected", null);
          break;

        case "disconnected":
        case "failed":
        case "closed":
          this.connections.delete(remoteSessionId);
          this.signal.dispatch("remoteClose", this.connections);
      }
    }

    RTCRef.onicecandidate = event => {
      if (event && event.candidate) {
        info("RTC::Candidate", RTCRef.connectionState)
        this.signal.sendout("rtc::ice_switch", event.candidate, remoteSessionId);
      }
    }

    let recvChannel!: RTCDataChannel;
    RTCRef.ondatachannel = event => {
      recvChannel = event.channel;

      recvChannel.onopen = e => {
        this.signal.dispatch("rtc::channelOpen", { endpoint: remoteSessionId, username: recvChannel.label });
      }

      recvChannel.onmessage = ({ data }) => {
        this.signal.dispatch("rtc::channelMsg", { endpoint: remoteSessionId, username: recvChannel.label, data });
      };
    }
    this.connections.set(remoteSessionId, { RTCRef, audio: new Audio, channel });
  }

  public toggleDevice() {
    if (this.device_) {
      this.streamEnabled = !this.streamEnabled;
      this.device_.getTracks().forEach(track => {
        track.enabled = this.streamEnabled;
      });
    }
  }

  public toggleMuted(sessionId) {
    const user = this.connections.get(sessionId);
    if (user) {
      user.audio.muted = !user.audio.muted;
    }
  }

  public setGuard(fn: RTCGuard) {
    if (typeof fn === "function")
      this.connectGuard_ = fn;
  }
}