import { randomTag } from "./utils.js";
import { Connector } from "./connector.js"
import { ConnectContext, ConnectRequest, IceSwitchInfo, RTCGuard, RTCState } from "./types.js";
import { iceConf } from "./config.js";
import { info } from "./log.js";

/** @class */
export class Streamings {
  public connections = new Map<string, ConnectContext>();
  public streamEnabled = false;
  private device_: MediaStream | null = null;
  private connectGuard_: Function = (sessionId) => { console.log(sessionId); return true; };

  constructor(public signal: Connector) {
    this.recv();
  }

  private async recv() {
    this.signal.on<ConnectRequest>("rtc::request", async (detail, replyToken) => {
      const { sdp, sessionId } = detail;
      if (this.connectGuard_(sessionId)) {
        const RTCRef = this.createPeerConnection(sessionId);
        /* SDP exchange */
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

  /**
   * @param  {string} sessionId
   */
  public async call(sessionId: string) {
    const replyToken = randomTag();
    const RTCRef = this.createPeerConnection(sessionId);
    const offer = await RTCRef.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
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

  public get state() {
    const remotes: RTCState[] = [];
    this.connections.forEach(user => {
      remotes.push({
        RTCnativeRef: user.RTCRef,
        connectionState: user.RTCRef.connectionState,
        sessionId: user.sessionId,
        source: user.audio,
        muted: user.audio.muted,
      });
    })
    return {
      self: { device: this.device_, enable: this.streamEnabled },
      remotes
    }
  }

  /**
   * @param  {string} remoteSessionId
   */
  private createPeerConnection(remoteSessionId: string) {
    const pc = new RTCPeerConnection();
    const icecandidate: RTCIceCandidate[] = [];
    const channel = pc.createDataChannel(this.signal.username ?? "@anonymous");
    const audio = new Audio;
    audio.autoplay = true;
    const media = new MediaStream;
    if (this.device_ !== null) {
      this.device_.getTracks().forEach(track => pc.addTrack(track));
    }

    /* when receive media stream */
    pc.ontrack = e => {
      const user = this.connections.get(remoteSessionId);
      if (user) {
        const [stream] = e.streams;
        user.media = stream;
        //const audioTrack = stream.getAudioTracks();
        //const audioStream = new MediaStream;
        //audioTrack.forEach(track => );
        //audioStream.addTrack(e.track)
        const media = new MediaStream;
        media.addTrack(e.track);
        user.audio.srcObject = media;
        user.audio.play();
      }
    }

    /* when connection close, remove it from connections */
    pc.onconnectionstatechange = () => {
      info("rtc::connection", `State: ${pc.connectionState}`);
      const closeStates = ["disconnected", "failed", "closed"];
      if (closeStates.some(state => pc.connectionState === state)) {
        this.connections.delete(remoteSessionId);
        this.signal.dispatch("rtc::disconnected", remoteSessionId);
      } else if (pc.connectionState === "connected") {
        this.signal.dispatch("rtc::connected", remoteSessionId);
      }
    }

    /* gather icecandiate, when complete, send to remote */
    pc.onicecandidate = e => {
      info("rtc::candidate", e.candidate);
      if (e && e.candidate) {
        icecandidate.push(e.candidate);
        this.signal.sendout("rtc::ice_switch", e.candidate, remoteSessionId);
      } else if (pc.iceGatheringState === "complete") {
        console.log("Gather success.");
        //icecandidate.forEach(candidate => {
        //  this.signal.sendout("rtc::ice_switch", candidate, remoteSessionId);
        //})
      }
    }

    /* When open data channel, proxy open & message event */
    pc.ondatachannel = event => {
      const recvChannel = event.channel;
      recvChannel.onopen = () => this.signal.dispatch("rtc::channel", { remoteSessionId, username: recvChannel.label });
      recvChannel.onmessage = ({ data }) => this.signal.dispatch("rtc::message", { remoteSessionId, username: recvChannel.label, data });
    }

    this.connections.set(remoteSessionId, { RTCRef: pc, sessionId: remoteSessionId, media, audio, channel });
    return pc;
  }

  /**
   * @param  {MediaStream} media
   */
  public setDevice(media: MediaStream) {
    this.device_ = media;
  }

  /**
   * @param  {boolean} enable
   */
  public setDeviceEnabled(enable: boolean) {
    if (this.device_) {
      this.streamEnabled = enable;
      this.device_.getTracks().forEach(track => {
        track.enabled = enable;
      });
    }
  }

  /**
   * @argument  {string} sessionId
   * @arg  {boolean} mute
   * 

   */
  public setRemoteMuted(sessionId: string, mute: boolean) {
    const user = this.connections.get(sessionId);
    if (user) {
      user.audio.muted = mute;
    }
  }

  /**
   * @param {RTCGuard} fn
   */
  public setGuard(fn: RTCGuard) {
    if (typeof fn === "function")
      this.connectGuard_ = fn;
  }
}