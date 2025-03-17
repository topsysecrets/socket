import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:5173' },
  transports: ['websocket'],
});

const availableRooms = ['room 1', 'room 2', 'room 3', 'room 4'];
const events = [
  'joinRoom',
  'getMessages',
  'setNickname',
  'chatMessage',
  'disconnect',
  'startTyping',
  'stopTyping',
];
const usersInRooms = {}; // { room: [userId, userId2], ..}
const messagesInRooms = {}; // { room: [{userId, msg, timestamp, nickname},..]}
const userToSocket = {}; // {userid1: socketid1, ...}
const userProfiles = {}; // {userid1: {nickname}, ...}

io.on('connection', (socket) => {
  console.log('a user connected', socket.id);

  let userId = socket.handshake.auth?.userId;

  if (!userId || !userToSocket[userId]) {
    userId = `user-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`Generated new userId: ${userId}`);

    socket.emit('session', { userId });
  } else {
    console.log(`Reconnected user with userId: ${userId}`);
  }

  userToSocket[userId] = socket.id;

  socket.emit('availableRooms', availableRooms);

  socket.on('joinRoom', ({ room, userId, username }) => {
    if (!userId || !socket.id) {
      console.error('Invalid userId or socket.id', { room, userId });
      return;
    }
    // validate a room name
    if (!availableRooms.includes(room)) {
      console.error('Unknown room');
      return;
    }

    // remove user from the previous chat
    for (const existingRoom in usersInRooms) {
      usersInRooms[existingRoom] = usersInRooms[existingRoom].filter(
        (id) => id !== userId
      );
    }

    // add to the new chat
    if (!usersInRooms[room]) usersInRooms[room] = [];
    usersInRooms[room].push(userId);
    console.log('userInRooms', JSON.stringify(usersInRooms));

    socket.join(room);
    socket.emit('messages', messagesInRooms[room]);

    if (username) {
      userProfiles[userId] = username;
    }

    // check if user exists in userToSocket
    if (!Object.keys(userToSocket).includes(userId)) {
      userToSocket[userId] = socket.id;

      let onlineUsers = [];
      for (const userId of Object.keys(userToSocket)) {
        const nickname = userProfiles[userId]?.nickname || null;
        onlineUsers.push([userId, nickname]);
      }

      io.emit('onlineUsers', onlineUsers);
    }

    console.log('userToSocket', JSON.stringify(userToSocket));
  });

  socket.on('getMessages', (room) => {
    if (!Object.keys(messagesInRooms).includes(room)) {
      console.error('Unknown room');
      return;
    }
    socket.emit('messages', messagesInRooms[room]);
  });

  socket.on('setNickname', (nickname) => {
    if (!nickname.length) {
      console.error('Nickname is required');
      return;
    }

    // get userid by socketid
    const userId = getUserIdBySocketId(socket.id);

    if (!userId) {
      console.error('User not found');
      return;
    }

    userProfiles[userId] = { ...userProfiles[userId], nickname };

    // re-sent updated users
    let onlineUsers = [];
    for (const userId of Object.keys(userToSocket)) {
      const nickname = userProfiles[userId]?.nickname || null;
      onlineUsers.push([userId, nickname]);
    }

    io.emit('onlineUsers', onlineUsers);

    // // update nickname in messages
    // for (const room in messagesInRooms) {
    //   messagesInRooms[room].forEach(msg => {
    //     if (msg.userID === userId)
    //       msg.nickname = nickname;
    //   })
    // }
    // socket.emit('allMessages', messagesInRooms);
  });

  socket.on('chatMessage', ({ userId, msg, room }) => {
    console.log({ userId, msg, room });
    console.log(userId, JSON.stringify(usersInRooms));
    if (!Object.keys(userToSocket).includes(userId)) {
      console.error('Unknown user');
      return;
    }

    if (!availableRooms.includes(room)) {
      console.error('Unknown room');
      return;
    }

    if (!msg || !msg.length) {
      console.error('Message is not provided');
      return;
    }

    const newMessage = {
      userId,
      msg,
      timestamp: Date.now(),
      nickname: userProfiles[userId]?.nickname || null,
    };

    if (!messagesInRooms[room]) messagesInRooms[room] = [];
    messagesInRooms[room].push(newMessage);
    io.to(room).emit('newMessage', newMessage);
    console.log(JSON.stringify(messagesInRooms));
  });

  socket.on('startTyping', () => {
    const userId = getUserIdBySocketId(socket.id);
    if (!userId) {
      console.error('no user found');
      return;
    }
    let userRoom = null;
    for (const room in usersInRooms) {
      if (usersInRooms[room].includes(userId)) {
        userRoom = room;
        break;
      }
    }
    if (!userRoom) {
      console.error('User is not in the room!');
      return;
    }
    const nickname = userProfiles[userId]?.nickname || null;
    io.to(userRoom).emit('typing', { userId, nickname });
  });

  socket.on('stopTyping', () => {
    const userId = getUserIdBySocketId(socket.id);
    if (!userId) {
      console.error('no user found');
      return;
    }

    let userRoom = null;
    for (const room in usersInRooms) {
      if (usersInRooms[room].includes(userId)) {
        userRoom = room;
        break;
      }
    }
    if (!userRoom) {
      console.error('User is not in the room!');
      return;
    }
    console.log('stop typing');
    io.to(userRoom).emit('stopTyping', userId);
  });

  socket.on('disconnect', () => {
    const userId = getUserIdBySocketId(socket.id);

    if (!userId) {
      console.error('User not found');
      return;
    }

    // remove user from a room
    for (const room in usersInRooms) {
      usersInRooms[room] = usersInRooms[room].filter((id) => id !== userId);
    }

    if (userToSocket[userId]) {
      delete userToSocket[userId];
      io.emit('onlineUsers', userToSocket);
    }

    if (userProfiles[userId]) delete userProfiles[userId];

    console.log('user disconnected', socket.id);
    console.log(JSON.stringify(usersInRooms));
  });

  socket.onAny((event) => {
    if (events.includes(event)) return;

    socket.emit('error', { message: `Unknown event: ${event}` });
  });
});

io.on('error', (e) => console.error(e));

server.listen(4000, () => console.log('listening on *:4000'));

function getUserIdBySocketId(socketId) {
  return (
    Object.keys(userToSocket).find(
      (userId) => userToSocket[userId] === socketId
    ) || null
  );
}
