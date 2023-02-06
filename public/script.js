const socket = io('http://localhost:3000')

const msgerForm = get(".msger-inputarea");
const msgerInput = get(".msger-input");
const msgerChat = get(".msger-chat");

const messageContainer = document.getElementById('message-container')
const roomContainer = document.getElementById('room-container')
const messageForm = document.getElementById('send-container')
const messageInput = document.getElementById('message-input')

const left_IMG = "https://www.linkpicture.com/q/profile-icon-2.png";
const right_IMG = "https://www.linkpicture.com/q/profile-icon-1.png";

if (messageForm != null) {
  const name = prompt('What is your name?')
  appendMessage("You",right_IMG,"right","You joined")
  socket.emit('new-user', roomName, name)

msgerForm.addEventListener('submit', e => {
  e.preventDefault()
  const message = msgerInput.value
  
  appendMessage("You",right_IMG,"right",message)
  socket.emit('send-chat-message', roomName, message)
  msgerInput.value = ''
})
}

socket.on('room-created', room => {
  const roomElement = document.createElement('div')
  roomElement.innerText = room
  const roomLink = document.createElement('a')
  roomLink.href = `/${room}`
  roomLink.innerText = 'join'
  roomContainer.append(roomElement)
  roomContainer.append(roomLink)
})

socket.on('chat-message', data => {
  appendMessage(data.name,left_IMG,"left",data.message)
})

socket.on('user-connected', name => {
  appendMessage("NOTE!!",left_IMG,"left",`${name} has entered the chat :)`)
})

socket.on('user-disconnected', name => {
  appendMessage("NOTE!!",left_IMG,"left",`${name} has left the chat :(`)
})

function get(selector, root = document) {
  return root.querySelector(selector);
}

function formatDate(date) {
  const h = "0" + date.getHours();
  const m = "0" + date.getMinutes();

  return `${h.slice(-2)}:${m.slice(-2)}`;
}

function appendMessage(name, img, side, text) {
  const msgHTML = `
    <div class="msg ${side}-msg">
      <div class="msg-img" style="background-image: url(${img})"></div>
      <div class="msg-bubble">
        <div class="msg-info">
          <div class="msg-info-name">${name}</div>
          <div class="msg-info-time">${formatDate(new Date())}</div>
        </div>

        <div class="msg-text">${text}</div>
      </div>
    </div>
  `;
  msgerChat.insertAdjacentHTML("beforeend", msgHTML);
  msgerChat.scrollTop += 500;
}