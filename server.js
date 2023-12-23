const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)

app.set('views', './views')
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))

const rooms = { }

app.get('/', (req, res) => {
  res.render('index', { rooms: rooms })
})

app.post('/room', (req, res) => {
  if (rooms[req.body.room] != null) {
    return res.redirect('/')
  }
  rooms[req.body.room] = { users: {} }
  res.redirect(req.body.room)
  io.emit('room-created', req.body.room)
})

app.get('/:room', (req, res) => {
  if (rooms[req.params.room] == null) {
    return res.redirect('/')
  }
  res.render('room', { roomName: req.params.room })
})

server.listen(3000)

///
function extractMessage(message) {


  // Define a regular expression to match the pattern (number, number): message
  const regex = /\((\d+),(\d+)\): (.+)/;
  
  // Use the regular expression to extract the values and the message
  const match = message.match(regex);
  let e = 0;
  let n = 0;
  let messageAfter = "";
  if (match) {
    e = match[1];  // Extract the first number, 19
    n = match[2];  // Extract the second number, 881
    messageAfter = match[3];  // Extract the message, "what is going on"
  
    console.log(`group1 = ${e}`);
    console.log(`group2 = ${n}`);
    console.log(`messageAfter = ${messageAfter}`);
    const publicKey = {e,n};
    return [publicKey, messageAfter];
  } 
  else {
    console.log("Pattern not found in the message.");
    const defaultPublicKey = [0,0];
    return [defaultPublicKey,message];
  }

}



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

///


io.on('connection', socket => {
  socket.on('new-user', (room, name, publicKey, privateKey) => {
    socket.join(room)
    rooms[room].users[socket.id] = name
    socket.to(room).broadcast.emit('user-connected', name, publicKey)
  })
  socket.on('send-chat-message', (publicKey, room, message) => {
    const [publicKeySender,msg] = extractMessage(message);
    const mesg = msg;
    const {e,n} = publicKeySender;
    console.log("e : " + e + ", n : " + n);
    console.log("mesg : " + msg);
    let c_arr = [];
    let c_string = ""
    let len = mesg.length;
    for (let i = 0; i < mesg.length; i++) {
      c_arr.push(encrypt(mesg.charCodeAt(i), publicKeySender));
      c_string += encrypt(mesg.charCodeAt(i), publicKeySender);
    }
    if(!e && !n) {
      socket.to(room).broadcast.emit('chat-message-all', publicKey, { message: message, name: rooms[room].users[socket.id] })
    }
    else {
      socket.to(room).broadcast.emit('chat-message', publicKey, { message: c_arr.toString(), name: rooms[room].users[socket.id], e: e, n: n })
    }
    
  })
  socket.on('disconnect', () => {
    getUserRooms(socket).forEach(room => {
      socket.to(room).broadcast.emit('user-disconnected', rooms[room].users[socket.id])
      delete rooms[room].users[socket.id]
    })
  })
})

function getUserRooms(socket) {
  return Object.entries(rooms).reduce((names, [name, room]) => {
    if (room.users[socket.id] != null) names.push(name)
    return names
  }, [])
}