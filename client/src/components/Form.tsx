import { FormEvent, useRef } from 'react';
import socket from '../utils/socket';
import { useSocketContext } from '../contexts/socketContext';

const Form = () => {
  const { currentRoom, isTyping, typingUser } = useSocketContext();
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  let timer: ReturnType<typeof setTimeout> | null = null;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!socket || !formRef.current) return;

    const data = new FormData(formRef.current);
    const msg = data.get('message');

    if (msg && typeof msg === 'string' && msg.length && msg.length < 200) {
      const userId = sessionStorage.getItem('userId');
      if (!userId) return Error('userId is not defined!');

      console.log({ msg });
      socket.emit('chatMessage', { userId, msg, room: currentRoom });
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleInput = () => {
    socket.emit('startTyping');
    timer && clearTimeout(timer);
    timer = setTimeout(() => {
      socket.emit('stopTyping');
    }, 1e3);
  };
  return (
    <form onSubmit={handleSubmit} ref={formRef} className="form">
      {isTyping && typingUser && <i>{typingUser} is typing...</i>}
      <div style={{ display: 'flex' }}>
        <input
          type="text"
          name="message"
          id="message"
          ref={inputRef}
          onInput={handleInput}
        />
        <button type="submit">Send</button>
      </div>
    </form>
  );
};

export default Form;
