import { config as dotenvConfig } from "dotenv";
dotenvConfig();
import express from "express";
import axios from "axios";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const app = express();
const port = process.env.PORT || 8051;

const updateInterval = parseInt(process.env.UPDATE_INTERVAL || "3600") * 1000;
const lavalinkSecure = process.env.LAVALINK_SERVER_SECURE === "true";
const lavalinkPassword = process.env.LAVALINK_SERVER_PASSWORD;
const lavalinkServerAddress =
  process.env.LAVALINK_SERVER_ADDRESS || "localhost";
const lavalinkServerPort = process.env.LAVALINK_SERVER_PORT || "2333";

const lavalinkUrl = new URL(
  `${
    lavalinkSecure ? "https" : "http"
  }://${lavalinkServerAddress}:${lavalinkServerPort}`
).href;
const tokenGeneratorServerAddress =
  process.env.TOKEN_GENERATOR_SERVER_ADDRESS || "localhost";
const tokenGeneratorServerPort =
  process.env.TOKEN_GENERATOR_SERVER_PORT || "8080";
const tokenGeneratorSecure =
  process.env.TOKEN_GENERATOR_SERVER_SECURE === "true";
const tokenGeneratorUrl = new URL(
  `${
    tokenGeneratorSecure ? "https" : "http"
  }://${tokenGeneratorServerAddress}:${tokenGeneratorServerPort}`
).href;

async function getNewToken() {
  const response = await axios.get(`${tokenGeneratorUrl}/update`);
  return response.data;
}

async function updateLavalink(poToken: string, visitorData: string) {
  const response = await axios.post(
    `${lavalinkUrl}/youtube`,
    {
      poToken,
      visitorData,
    },
    {
      headers: {
        Authorization: lavalinkPassword,
      },
    }
  );

  return response.status === 204;
}

async function updateCycle() {
  try {
    const tokenData = await getNewToken();
    const success = await updateLavalink(
      tokenData.potoken,
      tokenData.visitor_data
    );
    console.log(success ? "Token update successful" : "Token update failed");
  } catch (error) {
    console.error("Token update failed:", error);
  }
}

app.get("/helthz", (_: any, res) => {
  res.status(200).send("OK");
});

async function start() {
  console.log("Starting token update cycle...");
  await updateCycle();
  setInterval(updateCycle, updateInterval);

  app.listen(port, () => {
    console.log(`Health probe server running on port ${port}`);
  });
}

start().catch(console.error);
