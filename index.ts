import http from "http";
import fs from "fs";
import { Server } from "./server";
import {
  getStatsData,
  sendStatsData,
  getLevelData,
  sendLevelData,
  getLevels,
  songsContr,
  buffsContr,
  soundContr,
} from "./Arkanoid_API/controllers/gameData";
import {
  GET_STATS,
  POST_STATS,
  GET_LEVELS,
  GET_EDITOR_LEVELS,
  GET_LEVELS_MODIFIED,
  GET_SONGS,
  GET_BUFFS,
  GET_SOUNDS,
} from "./Arkanoid_API/constants/routes";
import { AllowCors } from "./middleware/cors";

const app: Server = new Server();

app.use((req: any, res: http.ServerResponse, next: Function) => {
  AllowCors(res);
  next();
});

const auth2 = (req: any, res: http.ServerResponse): void => {
  req.example = "example";
};

app.get(GET_STATS, getStatsData, [auth2, auth2]);
app.get(GET_LEVELS, getLevelData);
app.get(GET_LEVELS_MODIFIED, getLevels);
app.get(GET_SONGS, songsContr);
app.get(GET_BUFFS, buffsContr);
app.get(GET_SOUNDS, soundContr);
app.post(POST_STATS, sendStatsData);
app.post(GET_EDITOR_LEVELS, sendLevelData);

app.get("/nie", (req: any, res: http.ServerResponse) => {
  const file = fs.readFileSync("./services/views/index.html", {
    encoding: "utf-8",
  });
  res.write(file);
  res.end();
});
