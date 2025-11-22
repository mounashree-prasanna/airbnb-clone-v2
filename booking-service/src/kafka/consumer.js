import { Kafka } from "kafkajs";
import Booking from "../models/bookingModel.js";
import { sendStatusUpdate } from "./producer.js";

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || "booking-service",
  brokers: [process.env.KAFKA_BROKER || "kafka:9092"],
});

const consumer = kafka.consumer({ groupId: process.env.KAFKA_GROUP_ID || "booking-group" });

export const startBookingConsumer = async () => {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: "booking_requests", fromBeginning: true });
    console.log("👂 Booking Service listening to 'booking_requests'...");

    await consumer.run({
      eachMessage: async ({ message }) => {
        const data = JSON.parse(message.value.toString());
        console.log("📩 Received booking request:", data);
        try {
          const booking = await Booking.create(data);
          console.log("🗂️ Booking saved:", booking._id);
          // You can also trigger notifications or emails here if needed
        } catch (err) {
          console.error("❌ Booking save failed:", err);
        }
      },
    });
  } catch (err) {
    console.error("❌ Booking consumer error:", err);
  }
};
