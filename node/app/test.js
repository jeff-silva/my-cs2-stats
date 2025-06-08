import SteamAPI from "steamapi";
const steam = new SteamAPI(process.env.STEAM_API_KEY);
const userId = await steam.resolve("https://steamcommunity.com/id/olapada");
const userSummary = await steam.getUserSummary(userId);

console.log(userSummary);
