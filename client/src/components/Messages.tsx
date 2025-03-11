import { useEffect } from 'react';
import socket from '../utils/socket';
import { Message } from '../types';
import { useSocketContext } from '../contexts/socketContext';

const Messages = () => {
  const { updateMessages, messages } = useSocketContext();
  useEffect(() => {
    if (!socket) {
      console.error('no socket');
      return;
    }

    function handleNewMessage(msg: Message) {
      console.log(msg);
      updateMessages(msg);
    }
    socket.on('newMessage', (msg) => handleNewMessage(msg));

    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, []);

  const getDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000); // to milliseconds

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };

    return date.toLocaleString('en-GB', options).replace(',', ''); // 'en-GB' for English (UK) formatting
  };

  console.log(messages)
  return (
    <ul id="messages">
      {messages &&
        messages.map((msg) => {
          const currentUserId = sessionStorage.getItem('userId');
          const isAuthor = currentUserId === msg.userId;
          return (
            <li
              key={msg.timestamp}
              style={{
                textAlign: isAuthor ? 'right' : 'left',
                alignItems: isAuthor ? 'end' : 'start',
              }}
            >
              {!isAuthor && (
                <b>{msg.nickname || msg.userId.split('').slice(0, 10).join('') + '...'}</b>
              )}
              <div
                style={{
                  backgroundColor: isAuthor ? 'lightblue' : 'lightgreen',
                }}
                className='message'
              >
                {msg.msg}
              </div>
              <div className='date'>
                <i>{getDate(msg.timestamp)}</i>
              </div>
            </li>
          );
        })}
    </ul>
  );
};

export default Messages;
