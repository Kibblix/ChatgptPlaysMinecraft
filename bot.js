// imports mineflayer
const mineflayer = require('mineflayer')
const pathfinder = require('mineflayer-pathfinder').pathfinder;
const collectBlock = require('mineflayer-collectblock').collectBlock;
// sets goals and movements
const { GoalBlock } = require('mineflayer-pathfinder').goals;
const { GoalNear } = require('mineflayer-pathfinder').goals;
const { GoalFollow } = require('mineflayer-pathfinder').goals;
const { Movements } = require('mineflayer-pathfinder')
const collectBlockPlugin = require('mineflayer-collectblock').plugin
const Vec3 = require('vec3')
const OpenAI = require('openai')
const openai = new OpenAI({
  apiKey: "Casper_jeg_sendte_deg_nøkkelen_på_teams"
})

let mining = false
let lastAIAction = 0
const AI_COOLDOWN = 2000

const bot = mineflayer.createBot({
  host: '127.0.0.1', // server
  port: 25565,              // optional
  username: "Heroin_addict_1"      // email for ekte account
})
bot.once('spawn', () => {
  const mcData = require('minecraft-data')(bot.version)
  const movements = new Movements(bot, mcData)
  bot.pathfinder.setMovements(movements)
})

bot.loadPlugin(pathfinder)
bot.loadPlugin(collectBlockPlugin)

async function GPT(message, username) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `
You are a Minecraft bot controller.

if players are wondering about real life stuff you are allowed to talk about it.
you do not really have limits beyond your normal ones talk about anything.
You MUST respond in JSON format like this:
{
  "action": "command_name",
  "args": ["arg1", "arg2"]
}

Available actions:
- "chat" (args: [message])
- "come"
- "follow"
- "stop"
- "find" (args: [block])
- "mine" (args: [block])
- "farm" (args: [block])

Keep responses short and valid JSON only. If you are using commands that include blocks make sure to use the minecraft blocks so grass block is grass_block etc. THE ONLY EXCEPTION WHERE YOU WOULD CHAT BACK IS IF THE PLAYER IS CLEARLY TRYING TO HAVE A CHAT.
`
        },
        {
          role: "user",
          content: message
        }
      ]
    })

    const text = response.choices[0].message.content

    let data
    try {
      data = JSON.parse(text)
    } catch {
      bot.chat(text)
      return
    }
    if (Date.now() - lastAIAction < AI_COOLDOWN) {
        return
    }
    lastAIAction = Date.now()
    executeAICommand(data, username)

  } catch (err) {
    console.log(err)
    bot.chat("so yeah uhhh openai was lowk cooked so lock in and do sum about it")
  }
}
function executeAICommand(data, username) {
  const { action, args = [] } = data

  switch (action) {
    case "chat":
      bot.chat(args.join(" "))
      break

    case "come":
      gotoplayer(username)
      break

    case "follow":
      followplayer(username)
      break

    case "stop":
      mining = false
      bot.pathfinder.setGoal(null)
      bot.chat("Stopped.")
      break

    case "find":
      findBlockCommand(args[0])
      break

    case "mine":
      collectBlockCommand(args[0])
      break

    case "farm":
      farm(args[0])
      break

    default:
      bot.chat("GPT said some fuckass command that is not valid")
  }
}
function checkinput(username, message) {
  if (username === bot.username) return

  const args = message.split(" ")
  const command = args[0]

  if (command === 'come') {
    gotoplayer(username)
  }

  else if (command === 'follow') {
    followplayer(username)
  }

  else if (command === 'stop') {
    bot.chat("Stopped")
    mining = false
    bot.pathfinder.setGoal(null)
  }

  else if (command === 'find') {
    findBlockCommand(args[1])
  }

  else if (command === 'mine') {
    collectBlockCommand(args[1])
  }
  else if (command === 'farm') {
    farm(args[1])
  }

  else if (command === 'gpt') {
    GPT(args.slice(1).join(" "), username)
  }
  else {
    GPT(message, username)
  }
}
async function followplayer(username) {
  const player = bot.players[username]

  if (!player || !player.entity) {
    bot.chat("I cant see you bro")
    return
  }

  bot.chat("Following you brotha.")
  const goal = new GoalFollow(player.entity, 2)
  bot.pathfinder.setGoal(goal, true)
}
async function gotoplayer(username) {
  const targetPlayer = bot.players[username]

  if (!targetPlayer || !targetPlayer.entity) {
    bot.chat("I cant see you buddy, " + username)
    return
  }

  const p = targetPlayer.entity.position
  const goal = new GoalNear(p.x, p.y, p.z, 2)

  try {
    bot.chat(`Going to ${username}`)
    await bot.pathfinder.goto(goal)
     bot.chat('I have arrived brotato')
  } catch (err) {
    console.log(err.message) // Handle cases where pathfinding fails
    bot.chat("I cannot reach you master")
  }

}
async function findBlockCommand(blockName) {
  const mcData = require('minecraft-data')(bot.version)
  const block = mcData.blocksByName[blockName]

  if (!block) {
    bot.chat("Unknown block: " + blockName)
    return
  }

  const target = bot.findBlock({
    matching: block.id,
    maxDistance: 64
  })

  if (!target) {
    bot.chat("The block is not in my viscinity")
    return
  }

  bot.chat(`Found ${blockName}, walking away to it`)

  const goal = new GoalNear(target.position.x, target.position.y, target.position.z, 1)
  await bot.pathfinder.goto(goal)
}
async function collectBlockCommand(blockName) {
  const mcData = require('minecraft-data')(bot.version)
  const block = mcData.blocksByName[blockName]

  if (!block) {
    bot.chat("Unknown block")
    return
  }

  const target = bot.findBlock({
    matching: block.id,
    maxDistance: 64
  })

  if (!target) {
    bot.chat("Couldnt find block")
    return
  }

  try {
    bot.chat(`Mining ${blockName}`)
    await bot.collectBlock.collect(target)
    bot.chat("Done")
  } catch (err) {
    bot.chat("Failed to collect the block")
    console.log(err)
  }
}
async function farm(blockName) {
  const mcData = require('minecraft-data')(bot.version)
  const block = mcData.blocksByName[blockName]

  if (!block) {
    bot.chat("Unknown block")
    return
  }

  mining = true
  bot.chat(`Farming ${blockName} until you say stop`)

  while (mining) {
    const target = bot.findBlock({
      matching: block.id,
      maxDistance: 64
    })

    if (!target) {
      bot.chat("im outta blocks")
      break
    }

    try {
      // equip the best tool
      const tool = bot.pathfinder.bestHarvestTool(target)
      if (tool) await bot.equip(tool, 'hand')

      await bot.collectBlock.collect(target)

      // small delay so it wont go full crackhead mode
      await bot.waitForTicks(10)

    } catch (err) {
      console.log(err)
      bot.chat("somehow faila jeg å mine")
      break
    }
  }

  mining = false
  bot.chat("Stopped farming")
}

bot.on('chat', checkinput)
