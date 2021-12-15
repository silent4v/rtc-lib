const connectBtn = document.querySelector("#connectBtn");
const targetRoom = document.querySelectorAll("input[name=targetRoom]");
const userInRoom = document.querySelector("#userInRoom");
let currentRoom;

targetRoom.forEach(radio => {
  radio.onchange = async (e) => {
    await RTC.request("room::enter", e.target.value);
    currentRoom = e.target.value;
  };
});

connectBtn.onclick = async () => {
    await navigator.mediaDevices.getUserMedia({ audio: true }).then(RTC.setDevice);
    const [room] = await RTC.request("room::list", currentRoom);
    room.clients.filter(sid => sid !== RTC.sessionId).forEach(sid => {
      console.log("Call To:", sid.slice(0,7));
      RTC.call(sid);
    });
  };