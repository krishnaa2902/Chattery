window.addEventListener("beforeunload", function(e){
  // Do something
  e.preventDefault();
}, false);

const socket = io('http://localhost:3000')

const msgerForm = get(".msger-inputarea");
const msgerInput = get(".msger-input");
const msgerChat = get(".msger-chat");

const messageContainer = document.getElementById('message-container')
const roomContainer = document.getElementById('room-container')
const messageForm = document.getElementById('send-container')
const messageInput = document.getElementById('message-input')

const left_IMG = "img/profile-pic.jpg";
const right_IMG = "img/profile-pic.jpg";



////////////////////////////////////////////////////////////////////////



function gcd(a, b) {
  if (b == 0) {
      return a;
  }
  else if (b == 1) {
      return 1;
  }
  return gcd(b, a % b);
}

function modInverse(a, n) {
  for (let i = 1; i < n; i++) {
      if ((a * i) % n == 1) {
          return i;
      }
  }
  return -1;
}

function isPrime(n) {
  if(n==2) {
    return true;
  }
  else if (n%2==0 || n<2) {
    return false;
  }
  else {
    for (let i = 3; i <= Math.sqrt(n); i+=2) {
      if(n%i==0) {
        return false;
      }
    }
    return true;
  }
}

function generateKeys() {
  let p = 101;
  let q = 31;
  while(1) {
    p = Number(prompt("Enter a prime number : "));
    if(isPrime(p)) {
      break;
    }
  }
  while(1) {
    q = Number(prompt("Enter another prime number : "));
    if(isPrime(q) && p!=q && ((p*q) > 255)) {
      break;
    }
  }
  const n = p * q;
  const phi = (p - 1) * (q - 1);
  let e = Math.floor(Math.random() * (500 - 10 + 1)) + 10;
  while (1) {
    if (gcd(e, phi) == 1) {
      break;
    }
    e = Math.floor(Math.random() * (200 - 10 + 1)) + 10;
  }
  console.log("e = " + e);
  const d = modInverse(e, phi);
  const publicKey = { e, n };
  const privateKey = { d, n };
  return [publicKey, privateKey];
}


////////////////////////////////////////////////////////////////////////

let ourPrivateKey = [0,0];
let ourPublicKey = [0,0];

if (messageForm != null) {
  const name = prompt('What is your name?')
  const [publicKey, privateKey] = generateKeys();
  ourPrivateKey = privateKey;

  // ourPublicKey = publicKey;
  // console.log(publicKey);
  // console.log(ourPublicKey+"ourPublicKey");
  const {e,n} = publicKey;
  ourPublicKey[0] = e
  ourPublicKey[1] = n
  appendMessage(`You | (${e},${n}) `,null,right_IMG,"right","You joined")
  socket.emit('new-user', roomName, name, publicKey, privateKey)

msgerForm.addEventListener('submit', e => {
  e.preventDefault()
  const message = msgerInput.value;
  
  appendMessage("You",publicKey,right_IMG,"right",message)
  socket.emit('send-chat-message', publicKey,roomName, message)
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

socket.on('chat-message', (publicKey,data) => {
  const ct = data.message.split(',');
  console.log(ct)
  let plaintext = "";
  for (let i = 0; i < ct.length; i++) {
    plaintext += String.fromCharCode(decrypt(ct[i], ourPrivateKey) % 255);
  }
  console.log(plaintext);
  // appendMessage(data.name,publicKey, left_IMG,"left",data.message)
  const pK = "("+data.e+","+data.n+")";
  const opK = "("+ourPublicKey[0]+","+ourPublicKey[1]+")";
  if(pK == opK) {
    appendMessage(data.name,publicKey, left_IMG,"left",plaintext);
  }
  
})

socket.on('chat-message-all', (publicKey,data) => {
  appendMessage(data.name,publicKey, left_IMG,"left",data.message);
})

socket.on('user-connected', (name,publicKey) => {
  const {e,n} = publicKey;
  appendMessage("NOTE!!",null,left_IMG,"left",`${name} has entered the chat with public key (${e},${n}) :)`)
})

socket.on('user-disconnected', name => {
  appendMessage("NOTE!!",null,left_IMG,"left",`${name} has left the chat :(`)
})

function get(selector, root = document) {
  return root.querySelector(selector);
}

function formatDate(date) {
  const h = "0" + date.getHours();
  const m = "0" + date.getMinutes();

  return `${h.slice(-2)}:${m.slice(-2)}`;
}

////////////////////////////////////////////////////////////////////////
function encrypt(m, publicKey) {
  const { e, n } = publicKey;
  return modExp(m, e, n);
}

function decrypt(c, privateKey) {
  const { d, n } = privateKey;
  return modExp(c, d, n);
}

function modExp(base, exponent, modulus) {
  var result = 1;
  for (var i = 0; i < exponent; i++) {
      result = (result * base) % modulus;
  }
  return result;
}
////////////////////////////////////////////////////////////////////////


function appendMessage(name, publicKey, img, side, text) {

  if(publicKey == null) {
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
  else {
    const {e,n} = publicKey;
    const msgHTML = `
    <div class="msg ${side}-msg">
      <div class="msg-img" style="background-image: url(${img})"></div>
      <div class="msg-bubble">
        <div class="msg-info">
          <div class="msg-info-name">${name} | (${e},${n})</div>
          <div class="msg-info-time">${formatDate(new Date())}</div>
        </div>

        <div class="msg-text">${text}</div>
      </div>
    </div>
  `;
  msgerChat.insertAdjacentHTML("beforeend", msgHTML);
  msgerChat.scrollTop += 500; 
  }

}


//////////////


// function modExp(base, exponent, modulus) {
//   var result = 1;
//   for (var i = 0; i < exponent; i++) {
//       result = (result * base) % modulus;
//   }
//   return result;
// }
// function gcd(a, b) {
//   if (b == 0) {
//       return a;
//   }
//   else if (b == 1) {
//       return 1;
//   }
//   return gcd(b, a % b);
// }

// function modInverse(a, n) {
//   for (let i = 1; i < n; i++) {
//       if ((a * i) % n == 1) {
//           return i;
//       }
//   }
//   return -1;
// }

// function encrypt(m, publicKey) {
//   const { e, n } = publicKey;
//   return modExp(m, e, n);
// }

// function decrypt(c, privateKey) {
//   const { d, n } = privateKey;
//   return modExp(c, d, n);
// }

// function generateKeys() {
//   const p = Number(prompt("Enter a prime number : "));
//   const q = Number(prompt("Enter another prime number : "));
//   const n = p * q;
//   const phi = (p - 1) * (q - 1);
//   let e = 19;
//   const d = modInverse(e, phi);
//   const publicKey = { e, n };
//   const privateKey = { d, n };
//   return [publicKey, privateKey];
// }


// const [publicKey, privateKey] = generateKeys();
// let message = "krishnaa";
// let c_arr = [];
// for (let i = 0; i < message.length; i++) {
//   c_arr.push(encrypt(message.charCodeAt(i), publicKey));
// }
// console.log(c_arr)
// let plaintext = "";
// for (let i = 0; i < c_arr.length; i++) {
//   plaintext += String.fromCharCode(decrypt(c_arr[i], privateKey));
// }
// console.log(plaintext);
