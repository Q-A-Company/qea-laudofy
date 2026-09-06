import cors from "@fastify/cors";
import "dotenv/config";
import Fastify from "fastify";
import { classifyPhotoJob } from "./jobs/classifyPhoto.js";
import { boss, QUEUE_CLASSIFY_PHOTO } from "./lib/queue.js";
import { adminRoutes } from "./routes/admin.js";
import { photoRoutes } from "./routes/photos.js";
import { reportRoutes } from "./routes/reports.js";

// Rede de segurança: um erro não tratado em qualquer lugar (ex: falha
// transitória de conexão com o banco) não deve derrubar o servidor inteiro -
// só logamos. Sem isso, o processo Node crasha e todo mundo vê "Failed to
// fetch" no navegador até alguém notar e reiniciar manualmente.
process.on("unhandledRejection", (err) => {
  console.error("unhandledRejection:", err);
});
process.on("uncaughtException", (err) => {
  console.error("uncaughtException:", err);
});

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
});

app.get("/health", async () => ({ status: "ok" }));

await app.register(photoRoutes);
await app.register(reportRoutes);
await app.register(adminRoutes);

await boss.start();
await boss.createQueue(QUEUE_CLASSIFY_PHOTO);
await boss.work<{ photoId: string }>(QUEUE_CLASSIFY_PHOTO, async ([job]) => {
  await classifyPhotoJob(job.data);
});
app.log.info("Worker de classificação de fotos pronto");

const port = Number(process.env.PORT ?? 3333);

app
  .listen({ port, host: "0.0.0.0" })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
