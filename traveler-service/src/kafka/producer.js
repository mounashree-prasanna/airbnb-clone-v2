import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || "traveler-service",
  brokers: [process.env.KAFKA_BROKER || "kafka:9092"],
});

const producer = kafka.producer();

export const connectProducer = async () => {
  try {
    await producer.connect();
    console.log("✅ Kafka producer connected (Traveler)");
  } catch (err) {
    console.error("❌ Kafka producer failed:", err);
  }
};

export const sendBookingRequest = async (bookingData) => {
  try {
    await producer.send({
      topic: "booking_requests",
      messages: [{ value: JSON.stringify(bookingData) }],
    });
    console.log("📨 Sent booking request:", bookingData);
  } catch (err) {
    console.error("❌ Failed to send Kafka message:", err);
  }
};
