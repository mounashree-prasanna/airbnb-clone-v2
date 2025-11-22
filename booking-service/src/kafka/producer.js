import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || "booking-service",
  brokers: [process.env.KAFKA_BROKER || "kafka:9092"],
});

const producer = kafka.producer();

export const connectProducer = async () => {
  try {
    await producer.connect();
    console.log("✅ Kafka producer connected (Booking Service)");
  } catch (err) {
    console.error("❌ Kafka producer connection failed:", err);
  }
};

// Called when booking status is updated (Accepted/Cancelled)
export const sendStatusUpdate = async (updateData) => {
  try {
    await producer.send({
      topic: "booking_status_updates",
      messages: [{ value: JSON.stringify(updateData) }],
    });
    console.log("📨 Sent booking status update:", updateData);
  } catch (err) {
    console.error("❌ Failed to send booking update:", err);
  }
};
