import { config as dotenvConfig } from "dotenv";
dotenvConfig();
import express from "express";
import axios from "axios";

const app = express();
const port = process.env.PORT || 8051;

const updateInterval = parseInt(process.env.UPDATE_INTERVAL || "3600") * 1000;
const lavalinkSecure = process.env.LAVALINK_SERVER_SECURE === "true";
const lavalinkPassword = process.env.LAVALINK_SERVER_PASSWORD;
const lavalinkServerAddress = process.env.LAVALINK_SERVER_ADDRESS || "localhost";
const lavalinkServerPort = process.env.LAVALINK_SERVER_PORT || "2333";

const lavalinkUrl = new URL(
  `${lavalinkSecure ? "https" : "http"}://${lavalinkServerAddress}:${lavalinkServerPort}`
).href.replace(/\/$/, "");

const tokenGeneratorServerAddress = process.env.TOKEN_GENERATOR_SERVER_ADDRESS || "localhost";
const tokenGeneratorServerPort = process.env.TOKEN_GENERATOR_SERVER_PORT || "8080";
const tokenGeneratorSecure = process.env.TOKEN_GENERATOR_SERVER_SECURE === "true";
const tokenGeneratorUrl = new URL(
  `${tokenGeneratorSecure ? "https" : "http"}://${tokenGeneratorServerAddress}:${tokenGeneratorServerPort}`
).href.replace(/\/$/, "");

const updateCycleFailedRetryDelay = parseInt(process.env.UPDATE_CYCLE_FAILED_RETRY_DELAY || "30000");
const updateCycleMaxRetries = parseInt(process.env.UPDATE_CYCLE_MAX_RETRIES || "10");

async function getNewToken(maxRetries = 5) {
  const retryDelay = 2000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.get(`${tokenGeneratorUrl}/update`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get token (attempt ${attempt}/${maxRetries})`);
      if (attempt === maxRetries) throw error;
      console.log(`Retrying in ${retryDelay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

async function updateLavalink(poToken: string, visitorData: string, maxRetries = 5) {
  const retryDelay = 2000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.post(
        `${lavalinkUrl}/youtube`,
        { poToken, visitorData },
        { headers: { Authorization: lavalinkPassword } }
      );

      return response.status === 204;
    } catch (error) {
      console.error(`Failed to update Lavalink (attempt ${attempt}/${maxRetries})`);
      if (attempt === maxRetries) throw error;
      console.log(`Retrying in ${retryDelay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

async function updateCycle() {
  const maxRetries = updateCycleMaxRetries;
  const retryDelay = updateCycleFailedRetryDelay;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const tokenData = await getNewToken(10);
      const success = await updateLavalink(tokenData.potoken, tokenData.visitor_data, 10);

      if (success) {
        console.log("Token update successful");
        return;
      }

      console.log(`Token update failed, attempt ${attempt} of ${maxRetries}`);
    } catch (error) {
      console.error(`Token update failed (attempt ${attempt}):`, error);

      if (attempt < maxRetries) {
        console.log(`Retrying in ${retryDelay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  console.error("All retry attempts failed, waiting for next update cycle");
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
