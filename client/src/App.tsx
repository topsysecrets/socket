import './App.css';
import Form from './components/Form';
import JoinRoomModal from './components/JoinRoomModal';
import Messages from './components/Messages';
import OnlineUsers from './components/OnlineUsers';
import RoomSelector from './components/RoomSelector';
import UserNickname from './components/UserNickname';
import { useSocketContext } from './contexts/socketContext';

function App() {
  const { currentRoom } = useSocketContext();
  return (
    <div>
      {currentRoom ? (
        <>
          <RoomSelector />
          <UserNickname />
          <div style={{ display: 'flex' }}>
            <OnlineUsers />
            <Messages />
          </div>
          <Form />
        </>
      ) : (
        <JoinRoomModal />
      )}
    </div>
  );
}

export default App;