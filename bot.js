const mineflayer = require('mineflayer')
const pathfinder = require('mineflayer-pathfinder').pathfinder;
const collectBlock = require('mineflayer-collectblock').collectBlock;
const { GoalBlock } = require('mineflayer-pathfinder').goals;

bot.loadPlugin(pathfinder)
bot.loadPlugin(collectblock)

const bot = mineflayer.createBot({
  host: '127.0.0.1', // server
  port: 25565,              // optional
  username: 'lockedinninjer'         // or email for premium account
})
bot.on('chat', async (username, message) => {
  if (username === bot.username) return // Ignore its own messages

  if (message === 'come') {
    const targetPlayer = bot.players[username]

    if (!targetPlayer || !targetPlayer.entity) {
      bot.chat("I can't see you, " + username)
      return
    }

    const p = targetPlayer.entity.position
    // Define the goal: go to the player's X, Y, Z coordinates
    // GoalNear makes the bot get within a 2-block radius (adjust as needed)
    const goal = new GoalNear(p.x, p.y, p.z, 2)

    try {
      bot.chat(`Going to ${username}`)
      await bot.pathfinder.goto(goal)
      bot.chat('I have arrived!')
    } catch (err) {
      console.log(err.message) // Handle cases where pathfinding fails
      bot.chat("I can't reach you.")
    }
  }
})
