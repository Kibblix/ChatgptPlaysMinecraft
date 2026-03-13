const mineflayer = require('mineflayer')
const pathfinder = require('mineflayer-pathfinder').pathfinder;
const collectBlock = require('mineflayer-collectblock').collectBlock;
const { GoalBlock } = require('mineflayer-pathfinder').goals;

const bot = mineflayer.createBot({
  host: '127.0.0.1', // server
  port: 25565,              // optional
  username: 'lockedinninjer'         // or email for premium account
})
bot.on('chat', (username, message) => {
  if (username === bot.username) return
  if (message === 'hi') bot.chat(`Hello ${username}!`)
})

