import { Connector } from "./lib/lib/index.js";
window.RTC = null;
window.snapshot = null;
const userInRoom = document.querySelector("#userInRoom");
const connectionBtn = document.querySelector("#connectionBtn");
const readyStateBox = document.querySelector("#readyState");
const Buttons = document.querySelectorAll("button:not(#connectionBtn)");
const Inputs = document.querySelectorAll("input, select");
Buttons.forEach(btn => { btn.disabled = true; });
Inputs.forEach(input => { input.disabled = true; });

connectionBtn.onclick = async () => {
  RTC = new Connector(window.location.href.replace(/^http/, "ws").replace(/(\/)?$/, "/websocket/start"));
  // RTC.trace("*");
  readyStateBox.textContent = "Connecting";
  RTC.sockRef.addEventListener("open", () => {
    readyStateBox.textContent = "Connected";
    registerBtn.disabled = false;
  });
};

const registerBtn = document.querySelector("#registerBtn");
const SessionIdBox = document.querySelector("#SessionId");
registerBtn.onclick = async () => {
  const sessionId = await RTC.register("ExampleUser");
  SessionIdBox.textContent = sessionId;
  Buttons.forEach(btn => { btn.disabled = false; });
  Inputs.forEach(input => { input.disabled = false; });

  window.snapshot = await RTC.request("room::list");
  
  /* Build Default List */
  for (let i = 1; i <= 6; ++i) {
    const roomName = `Room${i}`;
    if (!window.snapshot.find(r => r.name === roomName)) {
      window.snapshot.push({
        name: roomName,
        clients: [],
        type: "$room"
      });
    }
  }
  window.snapshot.sort((a, b) => a.name < b.name ? -1 : 1);
  userInRoom.textContent = JSON.stringify(window.snapshot, null, 4);
  RTC.on("room::diff", detechUserChange);
};

const requestBtn = document.querySelector("#requestBtn");
const eventTypeSelect = document.querySelector("#eventTypeSelect");
const requestData = document.querySelector("#requestData");
const responseData = document.querySelector("#responseData");

eventTypeSelect.onchange = e => {
  console.log(e.target.value);
  loadTemplate(e.target.value);
};

requestBtn.onclick = async () => {
  const eventType = eventTypeSelect.value;
  let reqBody = requestData.value.trim();
  try {
    reqBody = JSON.parse(reqBody);
    const res = await RTC.request(eventType, reqBody);
    responseData.textContent = JSON.stringify(res, null, 4);
  } catch {
    reqBody = reqBody.toString();
    const res = await RTC.request(eventType, reqBody);
    responseData.textContent = JSON.stringify(res, null, 4);
  }
};

loadTemplate("ping-pong");
function loadTemplate(eventType) {
  switch (eventType) {
    case "ping-pong":
      requestData.textContent = JSON.stringify({
        describe: "ping-pong send request & recv original body",
        boolean: true,
        number: 1000,
        float: 100.300,
        string: "test-string"
      }, null, 4);
      break;
    case "text::subscribe":
      requestData.textContent = "ch1";
      break;
    case "text::unsubscribe":
      requestData.textContent = "ch1";
      break;
    case "text::message":
      requestData.textContent = JSON.stringify({
        channelName: "ch1",
        message: "Testing ~"
      }, null, 4);
      break;
  }
}

function detechUserChange({ from, to, sessionId, username }) {
  console.log(from, to, sessionId, username);
  if (from !== "$NONE") {
    const room = window.snapshot.find(r => r.name === from);
    const targetIndex = room.clients.indexOf(sessionId);
    room.clients.splice(targetIndex, 1);
  }

  if (to !== "$NONE") {
    const room = window.snapshot.find(r => r.name === to);
    room.clients.push(sessionId);
  }

  userInRoom.textContent = JSON.stringify(window.snapshot, null, 4);
}