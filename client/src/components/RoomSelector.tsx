import { useId } from 'react';
import { useSocketContext } from '../contexts/socketContext';

const RoomSelector = () => {
  const { currentRoom, setCurrentRoom, rooms } = useSocketContext();
  const id = useId();

  if (!currentRoom || currentRoom === undefined) {
    console.error('no current room')
    return;
  }

  return (
    <select
      name="currentRoom"
      id="currentRoom"
      onChange={(e) => setCurrentRoom(e.target.value)}
      value={currentRoom}
    >
      {rooms &&
        rooms.map((room) => (
          <option value={room} key={`${room}-${id}`}>
            {room.toUpperCase()}
          </option>
        ))}
    </select>
  );
};

export default RoomSelector;
