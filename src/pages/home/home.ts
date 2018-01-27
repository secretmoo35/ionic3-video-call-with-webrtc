import { Component } from '@angular/core';
import { NavController, LoadingController } from 'ionic-angular';

declare var apiRTC: any

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  showCall: Boolean;
  showAnswer: Boolean;
  showHangup: Boolean;
  showReject: Boolean;
  showStatus: Boolean;
  showMyVideo: Boolean = true;
  showRemoteVideo: boolean = true;

  webRTCClient: any;
  session: any;
  incomingCallId: string;
  myCallId: string;
  status: string;
  calleeId: string;

  constructor(
    public navCtrl: NavController,
    private loading: LoadingController
  ) {

  }

  ionViewDidLoad() {
    this.initializationRTC();
  }

  initializationRTC() {
    //apiRTC initialization
    let loading = this.loading.create();
    loading.present();
    apiRTC.init({
      apiKey: "YOUR API KEY",
      // apiCCId : "2", // room id *not set is auto.
      onReady: (e) => {
        this.sessionReadyHandler(e);
        loading.dismiss();
      }
    });
  }

  sessionReadyHandler(e) {
    this.myCallId = apiRTC.session.apiCCId;
    this.initializeWebRTCClient();
    this.initializeControls();
    this.addEventListeners();
  }

  initializeWebRTCClient() {
    this.webRTCClient = apiRTC.session.createWebRTCClient({
      status: "status" //Optionnal
    });
    // this.webRTCClient.setAllowMultipleCalls(false);
    // this.webRTCClient.setVideoBandwidth(300);
    // this.webRTCClient.setUserAcceptOnIncomingCall(true);
  }

  initializeControls() {
    this.showCall = true;
    this.showAnswer = false;
    this.showHangup = false;
    this.showReject = false;
  }

  addEventListeners() {
    apiRTC.addEventListener("userMediaSuccess", (e) => {
      this.showStatus = true;
      this.showMyVideo = true;

      this.webRTCClient.addStreamInDiv(e.detail.stream, e.detail.callType, "mini", 'miniElt-' + e.detail.callId, {
        width: "128px",
        height: "96px"
      }, true);

    });

    apiRTC.addEventListener("userMediaError", (e) => {
      this.initializeControlsForHangup();

      this.status = this.status + "<br/> The following error has occurred <br/> " + e;
    });

    apiRTC.addEventListener("incomingCall", (e) => {
      this.initializeControlsForIncomingCall();
      this.incomingCallId = e.detail.callId;
    });

    apiRTC.addEventListener("hangup", (e) => {
      if (e.detail.lastEstablishedCall === true) {
        this.initializeControlsForHangup();
      }
      this.status = this.status + "<br/> The call has been hunged up due to the following reasons <br/> " + e.detail.reason;
      this.removeMediaElements(e.detail.callId);
    });

    apiRTC.addEventListener("remoteStreamAdded", (e) => {
      this.webRTCClient.addStreamInDiv(e.detail.stream, e.detail.callType, "remote", 'remoteElt-' + e.detail.callId, {
        width: "300px",
        height: "225px"
      }, false);
    });

    apiRTC.addEventListener("webRTCClientCreated", (e) => {
      console.log("webRTC Client Created");
      this.webRTCClient.setAllowMultipleCalls(true);
      this.webRTCClient.setVideoBandwidth(300);
      this.webRTCClient.setUserAcceptOnIncomingCall(true);

      /*      this.InitializeControls();
            this.AddEventListeners();*/

      //this.MakeCall("729278");
    });

  }

  initializeControlsForHangup() {
    this.showCall = true;
    this.showAnswer = false;
    this.showReject = false;
    this.showHangup = false;
  }

  initializeControlsForIncomingCall() {
    this.showCall = false;
    this.showAnswer = true;
    this.showReject = true;
    this.showHangup = true;
    // this.nativeAudio.loop('uniqueI1').then((succ) => {
    //   console.log("succ", succ)
    // }, (err) => {
    //   console.log("err", err)
    // });

  }

  updateControlsOnAnswer() {
    this.showAnswer = false;
    this.showReject = false;
    this.showHangup = true;
    this.showCall = false;
  }

  updateControlsOnReject() {
    this.showAnswer = false;
    this.showReject = false;
    this.showHangup = false;
    this.showCall = true;
  }

  removeMediaElements(callId) {
    this.webRTCClient.removeElementFromDiv('mini', 'miniElt-' + callId);
    this.webRTCClient.removeElementFromDiv('remote', 'remoteElt-' + callId);
  }

  addStreamInDiv(stream, callType, divId, mediaEltId, style, muted) {
    let mediaElt = null;
    let divElement = null;

    if (callType === 'audio') {
      mediaElt = document.createElement("audio");
    } else {
      mediaElt = document.createElement("video");
    }

    mediaElt.id = mediaEltId;
    mediaElt.autoplay = true;
    mediaElt.muted = muted;
    mediaElt.style.width = style.width;
    mediaElt.style.height = style.height;

    divElement = document.getElementById(divId);
    divElement.appendChild(mediaElt);

    this.webRTCClient.attachMediaStream(mediaElt, stream);
  }

  MakeCall(calleeId) {
    var callId = this.webRTCClient.call(calleeId);
    if (callId != null) {
      this.incomingCallId = callId;
      this.showHangup = true;
    }
  }

  HangUp() {
    this.webRTCClient.hangUp(this.incomingCallId);
  }

  AnswerCall(incomingCallId) {
    this.webRTCClient.acceptCall(incomingCallId);
    // this.nativeAudio.stop('uniqueI1').then(() => { }, () => { });

    this.updateControlsOnAnswer();
  }

  RejectCall(incomingCallId) {
    this.webRTCClient.refuseCall(incomingCallId);
    this.updateControlsOnReject();
    this.removeMediaElements(incomingCallId);
  }


}
