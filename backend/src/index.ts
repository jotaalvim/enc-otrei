import "dotenv/config";
import cors from "cors";
import express from "express";
import chatRoutes from "./routes/chat.js";

const app = express();
const port = Number(process.env.PORT ?? 8787);

app.use(cors());
app.use(express.json());
app.use(chatRoutes);

app.listen(port, () => {
  console.log(`DogFinder backend running on http://localhost:${port}`);
});
