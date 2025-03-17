import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Socket } from 'socket.io-client';
import { Message } from '../types';

type SocketContextType = {
  currentRoom: null | string;
  setCurrentRoom: (room: string | null) => void;
  rooms: null | string[];
  setRooms: (rooms: string[] | null) => void;
  username: string | null;
  setUsername: (name: string) => void;
  socketId: string | null;
  setSocketId: (id: string | null) => void;
  socket: Socket | null;
  messages: Message[] | null;
  updateMessages: (msgs: Message) => void;
  onlineUsers: [string, string][] | null;
  isTyping: boolean;
  typingUser: string | null;
};

export const SocketContext = createContext<SocketContextType | undefined>(
  undefined
);

export const SocketProvider = ({
  children,
  socket,
}: {
  children: ReactNode;
  socket: Socket;
}) => {
  const [currentRoom, setCurrentRoom] = useState<string | null>(
    sessionStorage.getItem('currentRoom')
  );
  const [rooms, setRooms] = useState<string[] | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [socketId, setSocketId] = useState<string | null>(
    sessionStorage.getItem('socketId')
  );
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<[string, string][] | null>(
    null
  );
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  useEffect(() => {
    socket.on('connect', handleConnect);
    socket.on('connect_error', (error) => handleConnectError(error));
    socket.on('availableRooms', (newRooms) => handleAvailableRooms(newRooms));
    socket.on('messages', (msgs) => setMessages(msgs));
    socket.on('connect_failed', handleConnectFailedError);
    socket.on('error', errorHandler);
    socket.on('onlineUsers', updateOnlineUsers);
    socket.on('typing', ({ userId, nickname }) => handleTyping(userId, nickname));
    socket.on('stopTyping', (userId) => handleStopTyping(userId))
    socket.on('session', ({ userId }) => handleSession(userId));

    function handleConnect() {
      console.log('Connected to server, socket ID:', socket.id);
      updateSocketId(socket?.id || null);

      const id = sessionStorage.getItem('userId');

      console.log({ currentRoom, id });
      // if reconnection after disconnecting
      if (currentRoom && currentRoom !== undefined && id) {
        socket.emit('joinRoom', { room: currentRoom, userId: id, username });
      }
    }

    function handleConnectError(error: Error) {
      console.error('Socket connection error:', error);
    }

    function handleAvailableRooms(newRooms: string[] | null) {
      setRooms(newRooms);
    }

    function handleConnectFailedError(err: Error) {
      console.error('connect_failed_error', err);
    }

    function handleTyping(userId: string, nickname: string | null) {
      const currentUserId = sessionStorage.getItem('userId');
      if (userId !== currentUserId) {
        setIsTyping(true);
        setTypingUser(nickname || userId)
      }
    }

    function handleStopTyping(userId: string) {
      const currentUserId = sessionStorage.getItem('userId');
      console.log(userId, 'handle')
      if (userId !== currentUserId) {
        setIsTyping(false);
        setTypingUser(null);
        console.log('here')
      }
    }

    function handleSession(userId: string) {
      if (!sessionStorage.getItem('userId')) {
        sessionStorage.setItem('userId', userId);
        console.log(`Received new userId from server: ${userId}`);
      }
    }

    return () => {
      console.log('Cleaning up socket...');
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      socket.off('availableRooms', handleAvailableRooms);
      socket.off('connect_failed', handleConnectFailedError);
      socket.off('error', errorHandler);
      socket.off('onlineUsers', updateOnlineUsers);
      socket.off('typing',handleTyping);
      socket.off('stopTyping', handleStopTyping);
      socket.off('handleSession', handleSession);
    };
  }, []);

  function updateCurrentRoom(room: string | null) {
    const userId = sessionStorage.getItem('userId');

    setCurrentRoom(room);
    room
      ? sessionStorage.setItem('currentRoom', room)
      : sessionStorage.removeItem('currentRoom');

    console.log({ userId, username });
    if (!userId || !room) return;
    room && socket.emit('joinRoom', { room, userId });
  }

  function updateSocketId(id: string | null) {
    setSocketId(id);
    id
      ? sessionStorage.setItem('socketId', id)
      : sessionStorage.removeItem('socketId');
  }

  function updateMessages(msg: Message) {
    setMessages((msgs) => [...(msgs ?? []), msg]);
  }

  function errorHandler(error: Error) {
    console.log(error);
  }

  function updateOnlineUsers(onlineUsers: [string, string][] | null) {
    setOnlineUsers(onlineUsers);
  }

  const value = useMemo(
    () => ({
      socket,
      rooms,
      setRooms,
      currentRoom,
      setCurrentRoom: updateCurrentRoom,
      username,
      setUsername,
      socketId,
      setSocketId: updateSocketId,
      messages,
      updateMessages,
      onlineUsers,
      isTyping,
      typingUser
    }),
    [
      rooms,
      currentRoom,
      username,
      socketId,
      socket,
      messages,
      onlineUsers,
      isTyping,
      typingUser
    ]
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
};
