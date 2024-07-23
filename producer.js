const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'match-producer',
  brokers: ['localhost:9092'], 
});

const producer = kafka.producer();

const run = async () => {
  await producer.connect();
  let matchId = 1;
  setInterval(async () => {
    const message = {
      match: `Match ${matchId}`,
      score: `${Math.floor(Math.random() * 5)} - ${Math.floor(Math.random() * 5)}`,
    };
    await producer.send({
      topic: 'match-updates',
      messages: [
        { value: JSON.stringify(message) },
      ],
    });
    console.log(`Sent: ${JSON.stringify(message)}`);
    matchId++;
  }, 2000); 
};

run().catch(console.error);