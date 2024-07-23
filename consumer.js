const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'match-consumer',
  brokers: ['localhost:9092'], 
});

const consumer = kafka.consumer({ groupId: 'match-group' });

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'match-updates', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const matchUpdate = JSON.parse(message.value.toString());
      console.log(`Received: ${JSON.stringify(matchUpdate)}`);
    },
  });
};

run().catch(console.error);