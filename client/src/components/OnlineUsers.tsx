import { useSocketContext } from '../contexts/socketContext';

const OnlineUsers = () => {
  const { onlineUsers } = useSocketContext();
  const currentUserId = sessionStorage.getItem('userId');

  return (
    <div id="onlineUsers">
      <h3>Users Online</h3>
      {onlineUsers && onlineUsers.length ? (
        <ol>
          {onlineUsers.filter((user) => user[0] !== currentUserId).map((user) => {
            console.log({user});
            return (
            <li style={{ padding: '15px 0' }} key={user[0]}>
              {(user[1] || (user[0].split('').slice(0, 10).join('') + '...'))}
            </li>
          )})}
        </ol>
      ) : (
        <p style={{ fontSize: '16px', color: 'grey' }}>No user online</p>
      )}
    </div>
  );
};

export default OnlineUsers;
