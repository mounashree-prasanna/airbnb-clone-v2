const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || "owner-service",
  brokers: [process.env.KAFKA_BROKER || "kafka:9092"],
});

const consumer = kafka.consumer({
  groupId: process.env.KAFKA_GROUP_ID || "owner-group",
});

const startOwnerConsumer = async () => {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: "booking_status_updates", fromBeginning: true });
    console.log("👂 Owner listening for booking status updates...");

    await consumer.run({
      eachMessage: async ({ message }) => {
        const update = JSON.parse(message.value.toString());
        console.log("📩 Owner received booking update:", update);
        // This can be used to update owner's dashboard view later
      },
    });
  } catch (err) {
    console.error("❌ Owner Kafka consumer error:", err);
  }
};

module.exports = { startOwnerConsumer };
