import path from "path";
import fs from "fs";
import { Edge } from "edge.js";

const edge = Edge.create();
edge.mount(new URL("./templates", import.meta.url));

class Helper {
  static async jsonLoad(file, def = {}) {
    const content = await fs.promises.readFile(file, "utf-8");
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error(`Error parsing JSON from file ${file}:`, e);
      return def;
    }
  }

  static async templateSave(name, data) {
    const rendered = await edge.render(name, data);

    fs.promises.writeFile(
      path.join(process.cwd(), "pages", `${name}.html`),
      rendered,
      "utf-8"
    );
  }
}

const jsonStringify = (data) => {
  // return JSON.stringify(data);
  return JSON.stringify(data, null, 2);
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

  const data = playersMap.toData();

  fs.promises.writeFile(
    path.join(process.cwd(), "assets", "report_deaths_vs_kills_players.json"),
    jsonStringify(data),
    "utf-8"
  );

  const rendered = await edge.render("report_deaths_vs_kills_players", {
    data,
  });

  fs.promises.writeFile(
    path.join(process.cwd(), "pages", "report_deaths_vs_kills_players.html"),
    rendered,
    "utf-8"
  );
};

const generateSteamUsers = async (timelines) => {
  const users = Object.fromEntries(
    (await Helper.jsonLoad("./assets/users.json", [])).map((user) => {
      return [user.name, user];
    })
  );

  timelines.map((timeline) => {
    timeline.content.entries.map((entry) => {
      if (!entry.title) return;
      if (entry.title == "You killed yourself") return;
      if (entry.description == "with the world") return;

      let player = null;

      if (entry.title.startsWith("You killed")) {
        player = entry.title.replace("You killed ", "");
      } else if (entry.title.startsWith("You were killed by ")) {
        player = entry.title.replace("You were killed by ", "");
      }

      if (!player) return;

      const user = users[player] || {};
      user.name = player;
      user.steamId = user.steamId || null;

      user.steamProfile = user.steamId
        ? `https://steamcommunity.com/profiles/${user.steamId}`
        : null;

      user.steamSearch = `https://steamcommunity.com/search/users/#text=${encodeURIComponent(
        user.name
      )}`;

      users[user.name] = user;
    });
  });

  const data = Object.values(users);

  fs.promises.writeFile(
    path.join(process.cwd(), "assets", "users.json"),
    jsonStringify(data),
    "utf-8"
  );

  Helper.templateSave("users", { data });
};

const renderIndex = async (timelines) => {
  const rendered = await edge.render("index", {});
  fs.promises.writeFile(
    path.join(process.cwd(), "pages", "index.html"),
    rendered,
    "utf-8"
  );
};

const timelines = await generateTimelines();
await reportDeathsVsKillsPlayers(timelines);
await generateSteamUsers(timelines);
await renderIndex(timelines);
