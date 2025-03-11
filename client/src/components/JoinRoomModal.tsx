import { useState } from 'react';
import { useSocketContext } from '../contexts/socketContext';
import { createPortal } from 'react-dom';
import socket from '../utils/socket';

const JoinRoomModal = () => {
  const [isOpen, setIsOpen] = useState(true);
  const { setCurrentRoom, rooms } = useSocketContext();

  const joinRoom = (currentRoom: string) => {
    if (!socket) {
      console.error('no socket');
      return;
    }

    setCurrentRoom(currentRoom);
    setIsOpen(false);
  };

  return createPortal(
    <div className="backdrop" style={{ display: isOpen ? 'block' : 'none' }}>
      <div className="modal">
        <h3>Welcome! Please choose a room:</h3>
        <ul>
          {rooms &&
            rooms.map((room) => (
              <li key={room} onClick={() => joinRoom(room)}>
                {room}
              </li>
            ))}
        </ul>
      </div>
    </div>,
    document.body
  );
};

export default JoinRoomModal;
