const { Kafka } = require('kafkajs');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});
//initialize kafka client with producer and consumer
const kafka = new Kafka({
  clientId: 'match-producer',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'match-group' });

let scoreA = 0;
let scoreB = 0;
//define the types of event that can occure in a match and their discriptions
const eventTypes = [
  { type: 'goal', description: 'Goal by Team', participants: ['Player 1', 'Player 2', 'Player 3', 'Player 4'] },
  { type: 'freeKick', description: 'Free kick for Team', participants: ['Player 5'] },
  { type: 'substitution', description: 'Substitution in Team', participants: ['Player 9', 'Player 10'] },
  { type: 'penalty', description: 'Penalty for Team', participants: ['Player 13', 'Player 14', 'Player 15', 'Player 16'] }
];

const generateRandomEvent = (minute) => {
  const randomTypeIndex = Math.floor(Math.random() * eventTypes.length);
  const eventType = eventTypes[randomTypeIndex];
  const team = Math.random() > 0.5 ? 'A' : 'B';
  const participants = eventType.participants.slice(0, Math.floor(Math.random() * eventType.participants.length) + 1);
//generates a random event for a given time
  return {
    minute,
    type: eventType.type,
    description: `${eventType.description} ${team}`,
    participants,
  };
};

const generateMatchTimeline = () => {
  const timeline = [];
  const totalMinutes = 90;
  //events in a mach can range from 5 to 15 
  const eventCount = Math.floor(Math.random() * 10) + 5; 

  for (let i = 0; i < eventCount; i++) {
    const minute = Math.floor(Math.random() * totalMinutes) + 1;
    timeline.push(generateRandomEvent(minute));
  }

  timeline.sort((a, b) => a.minute - b.minute);
  timeline.push({ minute: 90, type: 'fulltime', description: 'Fulltime', participants: [] });

  return timeline;
};

const runProducer = async () => {
  await producer.connect();
  let currentMinute = 1;
  const matchTimeline = generateMatchTimeline();

  const sendEvent = async (event) => {
    if (event.type === 'goal') {
      if (event.description.includes('Team A')) scoreA++;
      else scoreB++;
    }

    const message = {
      match: 'Match 1',
      time: event.minute,
      event: event.type,
      description: event.description,
      participants: event.participants,
      score: `${scoreA} - ${scoreB}`,
    };

    await producer.send({
      topic: 'match-updates',
      messages: [{ value: JSON.stringify(message) }],
    });
    console.log(`Sent: ${JSON.stringify(message)}`);
  };

  const simulateMatch = async () => {
    for (const event of matchTimeline) {
      while (currentMinute < event.minute) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate each minute
        currentMinute++;
      }
      await sendEvent(event);
    }
  };

  simulateMatch();
};

const runConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'match-updates', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const matchUpdate = JSON.parse(message.value.toString());
      console.log(`Received: ${JSON.stringify(matchUpdate)}`);
      io.emit('match-update', matchUpdate);
    },
  });
};

runProducer().catch(console.error);
runConsumer().catch(console.error);

server.listen(4000, () => {
  console.log('WebSocket server listening on port 4000');
});
