let usersCount = 0;

const addUser = document.querySelector("#addUser");
const userList = document.querySelector("#userList");
const logBox = document.querySelector("#logBox");
const refreshLog = document.querySelector("#refreshLog");

/* Send Message Component */
const msgBtn = document.querySelector("#msgBtn");
const messageBox = document.querySelector("#messageBox");
const targetChannel = document.querySelector("#targetChannel");

refreshLog.onclick = () => {
  logBox.innerHTML = "";
};

addUser.onclick = async () => {
  usersCount++;
  const username = `USER_${usersCount.toString().padStart(3, 0)}`;
  const client = new RTCCore.Connector(
    window.location.href.replace(/^http/, "ws")
      .replace(":30000", ":31000")
  );
  const sid = await client.register(username);

  const userCard = document.createElement("div");

  const atChannel = document.createElement("select");

  client.only("channel1");
  client.on("text::message", ({ channelName, message, from, at }) => {
    const [_, remote] = from.split("::");
    const log = document.createElement("p");
    log.textContent = `[${new Date(at).toLocaleTimeString()}] ${remote}@${channelName} say ${message} to ${username}`;
    log.className = "log";
    logBox.append(log);
  });

  /* Append Element */
  userCard.innerHTML = `
    ${username}<sub>${sid.slice(0, 8)}</sub> @ 
  `;

  atChannel.onchange = e => client.only(e.target.value);
  atChannel.innerHTML = `
    <option value="channel1">channel 1</option>
    <option value="channel2">channel 2</option>
    <option value="channel3">channel 3</option>
    <option value="channel4">channel 4</option>
    <option value="channel5">channel 5</option>
    <option value="channel6">channel 6</option>
  `;


  userCard.appendChild(atChannel);
  userList.appendChild(userCard);
};

msgBtn.onclick = () => {
  /* Send Text Example */
  const message = messageBox.value;
  const channel = targetChannel.value;
  console.log(channel, message);
  messageBox.value = "";
  RTC.talk(channel, message);
};