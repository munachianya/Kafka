import React, { useEffect, useState } from 'react';
import socketIOClient from 'socket.io-client';
import './App.css';

const ENDPOINT = "http://localhost:4000";

function App() {
  const [matchUpdates, setMatchUpdates] = useState([]);
  const [mainScore, setMainScore] = useState('');

  useEffect(() => {
    const socket = socketIOClient(ENDPOINT);
    socket.on('match-update', (update) => {
      setMatchUpdates((prevUpdates) => [update, ...prevUpdates]);
      if (update.event !== 'halftime' && update.event !== 'fulltime' && update.event !== 'extraTime') {
        setMainScore(update.score); // Update the main score headline
      }
    });

    return () => socket.disconnect();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Match Updates</h1>
        <h2>Main Score: {mainScore}</h2>
        <ul>
          {matchUpdates.map((update, index) => (
            <li key={index}>
              {update.time}' - {update.description} 
              {update.participants.length > 0 && ` (Participants: ${update.participants.join(', ')})`}
            </li>
          ))}
        </ul>
      </header>
    </div>
  );
}

export default App;
