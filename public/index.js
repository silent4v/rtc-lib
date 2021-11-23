import { Connector } from "/lib/lib/index.js";
window.RTC = null;

const connectionBtn = document.querySelector("#connectionBtn");
const readyStateBox = document.querySelector("#readyState");
const Buttons = document.querySelectorAll("button:not(#connectionBtn)");
Buttons.forEach(btn => { btn.disabled = true; });

connectionBtn.onclick = async () => {
  RTC = new Connector("ws://localhost:30000");
  // RTC.trace("*");
  readyStateBox.textContent = "Connecting";
  RTC.sockRef.addEventListener("open", () => {
    readyStateBox.textContent = "Connected";
    Buttons.forEach(btn => { btn.disabled = false; });
  });
};

const registerBtn = document.querySelector("#registerBtn");
const SessionIdBox = document.querySelector("#SessionId");
registerBtn.onclick = async () => {
  const sessionId = await RTC.register("ExampleUser");
  SessionIdBox.textContent = sessionId;
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