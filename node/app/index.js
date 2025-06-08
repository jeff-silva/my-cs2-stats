import path from "path";
import fs from "fs";

const jsonStringify = (data) => {
  return JSON.stringify(data);
};

const generateTimelines = async () => {
  const files = await fs.promises.readdir(
    path.join(process.cwd(), "volumes", "timelines")
  );

  const timelines = [];

  await Promise.all(
    files.map(async (file) => {
      file = path.join(process.cwd(), "volumes", "timelines", file);
      const id = path.parse(file).name;
      const content = JSON.parse(await fs.promises.readFile(file, "utf-8"));
      timelines.push({ id, content });
    })
  );

  fs.promises.writeFile(
    path.join(process.cwd(), "assets", "timelines.json"),
    jsonStringify(timelines),
    "utf-8"
  );

  return timelines;
};

const reportDeathsVsKillsPlayers = async (timelines) => {
  const entries = [];

  timelines.map((timeline) => {
    timeline.content.entries.map((entry) => {
      entries.push(entry);
    });
  });

  const playersMap = new (class {
    attrs = {};
    players = {};
    add(player, attr) {
      this.attrs[attr] = true;

      if (!this.players[player]) {
        this.players[player] = {};
      }

      if (!this.players[player][attr]) {
        this.players[player][attr] = 0;
      }

      this.players[player][attr]++;
    }

    toData() {
      for (const player in this.players) {
        for (const attr in this.attrs) {
          if (typeof this.players[player][attr] === "undefined") {
            this.players[player][attr] = 0;
          }
        }
      }

      const data = Object.entries(this.players).map(([player, attrs]) => {
        return { player, ...attrs };
      });

      return data;
    }
  })();

  entries.map((entry) => {
    if (!entry.title) return;
    if (entry.title == "You killed yourself") return;
    if (entry.description == "with the world") return;

    if (entry.title.startsWith("You killed")) {
      const player = entry.title.replace("You killed ", "");
      playersMap.add(player, "killTotals");

      if (entry.description == "with the Knife") {
        playersMap.add(player, "killKnifeTotals");
      }
    }

    if (entry.title.startsWith("You were killed by ")) {
      const player = entry.title.replace("You were killed by ", "");
      playersMap.add(player, "killedByTotals");

      if (entry.description == "with the Knife") {
        playersMap.add(player, "killedByKnifeTotals");
      }
    }
  });

  fs.promises.writeFile(
    path.join(process.cwd(), "assets", "report_deaths_vs_kills_players.json"),
    jsonStringify(playersMap.toData()),
    "utf-8"
  );
};

const timelines = await generateTimelines();
await reportDeathsVsKillsPlayers(timelines);
