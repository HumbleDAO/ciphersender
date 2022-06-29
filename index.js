// Search for Scheduled Transactions that are available for execution

// Attempts to Execute a pending transaction that

// CONFIGURATIONS
const { TwitterApi } = require("twitter-api-v2");
const twitterClient = new TwitterApi(process.env.TWITTER_API);

require("dotenv").config();
const Web3 = require("web3");
const { Webhook, MessageBuilder } = require("discord-webhook-node");
const hook = new Webhook(process.env.DISCORD_WEBHOOK);
const Provider = require("@truffle/hdwallet-provider");
const provider = new Provider(process.env.PRIVATE_KEY, process.env.WSS_POLYGON);
const web3 = new Web3(provider);
const web3Socket = new Web3(
  new Web3.providers.WebsocketProvider(process.env.WSS_POLYGON),
  {
    // Enable auto reconnection
    reconnect: {
      auto: true,
      delay: 5000, // ms
      maxAttempts: 20,
      onTimeout: false,
    },
  }
);
// const json = require("../nuxt-app/contracts/ABI/RocketFactory.json");
// const tagJSON = require("../nuxt-app/contracts/ABI/GoofyGoober.json");
const craftingAbi = require("./contracts/Crafting.json");
const gameMasterAbi = require("./contracts/GameMaster.json");
const operatorAbi = require("./contracts/Characters.json");

const Crafting = new web3Socket.eth.Contract(
  craftingAbi.abi,
  process.env.CRAFTING_CONTRACT
);

const GameMaster = new web3Socket.eth.Contract(
  gameMasterAbi.abi,
  process.env.GAMEMASTER_CONTRACT
);

const Operators = new web3Socket.eth.Contract(
  operatorAbi.abi,
  process.env.CHARACTERS_CONTRACT
);

// FOR LISTENING TO CRAFTING CONTRACT EVENTS

Crafting.events
  .Salvage({}, function (error, event) {
    // console.log("EVENT FIRST".event);
  })
  .on("connected", function (subscriptionId) {
    console.log(subscriptionId, "Listening to Salvaged Weapons");
  })
  .on("data", function (event) {
    sendDiscordEmbedWeaponSalvaged(event);
  });

GameMaster.events
  .FightOutcome({}, function (error, event) {
    // console.log("EVENT FIRST".event);
  })
  .on("connected", function (subscriptionId) {
    console.log(subscriptionId, "Listening to FightOutcomes Weapons");
  })
  .on("data", function (event) {
    sendDiscordEmbedFightOutcome(event);
  });

Operators.events
  .FightOutcome({}, function (error, event) {
    // console.log("EVENT FIRST".event);
  })
  .on("connected", function (subscriptionId) {
    console.log(subscriptionId, "Listening to FightOutcomes Weapons");
  })
  .on("data", function (event) {
    sendDiscordEmbedFightOutcome(event);
  });

//Functions

async function sendDiscordMessage(botName, msg) {
  hook.setUsername(botName);
  hook.send(msg);
}

async function sendDiscordEmbedFightOutcome(result) {
  hook.setUsername("BattleSentry");
  console.log(result.returnValues);
  //   hook.send(msg);
  let owner = result.returnValues.owner;
  let playerRoll = result.returnValues.playerRoll;
  let enemyRoll = result.returnValues.enemyRoll;
  const embed = new MessageBuilder()
    .setTitle("Droid Battle")

    .setURL("https://app.ciphershooters.io/battle/")
    .addField("Battle By", owner, true)
    .addField("Player Roll", playerRoll)
    .addField("Enemy Roll", enemyRoll)

    .setColor("#00b0f4")
    .setImage("https://www.ciphershooters.io/assets/dist/css/img/slider.png")
    .setFooter(
      "CipherShooters",
      "https://www.ciphershooters.io/assets/dist/css/img/slider.png"
    )
    .setTimestamp();

  hook.send(embed);
}

async function sendDiscordEmbedWeaponSalvaged(result) {
  hook.setUsername("CraftingBot");
  //   hook.send(msg);
  let sender = (result.returnValues.sender =
    "0xDE29485dF7e941866442ceb25DCe1b9c64D02A26");
  let reward = (result.returnValues.reward = "5000");
  let gunQuality = (result.returnValues.gunQuality = "0");
  const embed = new MessageBuilder()
    .setTitle("Weapon Salvaged")

    .setURL("https://app.ciphershooters.io/workshop/")
    .addField("Salvaged By", sender, true)
    .addField("Reward", reward)
    .setColor("#00b0f4")
    .setThumbnail("https://app.ciphershooters.io/_nuxt/img/sniper.6bb3c98.gif")
    .setImage("https://app.ciphershooters.io/_nuxt/img/sniper.6bb3c98.gif")
    .setFooter(
      "CipherShooters",
      "https://app.ciphershooters.io/_nuxt/img/sniper.6bb3c98.gif"
    )
    .setTimestamp();

  hook.send(embed);
}

async function queryForTransactions() {
  let totalTransactions = -1;
  await Rocket.methods
    .getAllTransactions()
    .call({ from: process.env.ADDRESS }, (error, result) => {
      pendingTransactions = result.filter((obj) => {
        return obj.pending == true;
      });

      if (pendingTransactions.length != totalTransactions) {
        totalTransactions = pendingTransactions.length;
        console.log(`${totalTransactions} are pending for execution`);
      } else {
        console.log("We are fully updated with all transactions");
      }

      if (pendingTransactions) {
        pendingTransactions.map(async (obj) => {
          const blockNumber = await web3.eth.getBlockNumber();
          const timestamp = await web3.eth.getBlock(blockNumber);
          console.log(
            obj.deadline,
            timestamp.timestamp,
            obj.deadline < timestamp.timestamp
          );
          await Rocket.methods
            .executeTransaction(obj.id)
            .send({ from: process.env.ADDRESS }, function (error, result) {
              console.log(result);
              if (error) console.log(error);
            });
        });
      }
    });
}

async function createScheduledTransaction() {
  let appr = await CTAG.methods
    .approve(addy, String(100 * 10 ** 18))
    .send({ from: process.env.ADDRESS }, function (error, result) {
      console.log(result);
      if (error) console.log(error);
    });
  console.log(appr);
  let res = await Rocket.methods
    .createTransaction(
      "0x54e51feF99fFcCDCE4a7391a7c81FB0087A376de",
      "0xc69f4ef2138764a52e7dd7ec2931d1cdd7b32d0f", // Cipher Tags
      10 * 10 ** 18,
      1,
      0
    )
    .send({ from: process.env.ADDRESS }, function (error, result) {
      console.log(result);
      if (error) console.log(error);
    });

  // let res = await Rocket.methods
  //   .createTransaction(
  //     '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
  //     '0xDe60452084676294786a99E4dF017c7d5Aad9681',
  //     0,
  //     1,
  //     0,
  //   )
  //   .send({ from: process.env.ADDRESS }, function (error, result) {
  //     console.log(result)
  //     if (error) console.log(error)
  //   })
}

async function checkUpkeep() {
  let res = await Rocket.methods
    .checkUpkeep(1333)
    .call({ from: process.env.ADDRESS }, function (error, result) {
      console.log(result);
      if (error) console.log(error);
    });
}

// sendDiscordMessage("Recon Drone", "Hello There");
// sendDiscordEmbed();
// BOT LOGIC
// setInterval(function () {
//   createScheduledTransaction();
//   // queryForTransactions()
//   checkUpkeep();
// }, 2000);

// id: '1',
// owner: '0x4Ee949b24eDE8a2D5780f8a5038D940707Ef1070',
// receiver: '0x0000000000000000000000000000000000001010',
// deadline: '1652078273',
// ERC20TokenAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
// amount: '1',
// tip: '0',
// pending: true

// {
//     address: '0xf202f40D8fAC43d5827A449a23efB636df6bF030',
//     blockNumber: 29699894,
//     transactionHash: '0x2436dfbad43f5d332760ad61c8e6c7c95367a2b865a015e1c672a3cbaee41852',
//     transactionIndex: 41,
//     blockHash: '0xc6aedb1c2deeefdf91b6eb87c31f4fd3a67f314fc590a9fc0beaf5c487885a83',
//     logIndex: 215,
//     removed: false,
//     id: 'log_962cc71a',
//     returnValues: Result {
//       '0': '0xDE29485dF7e941866442ceb25DCe1b9c64D02A26',
//       '1': '5000',
//       '2': '0',
//       sender: '0xDE29485dF7e941866442ceb25DCe1b9c64D02A26',
//       reward: '5000',
//       gunQuality: '0'
//     },
//     event: 'Salvage',
//     signature: '0x0b1251cf7e5e829a5628351a2e2e73a37ce3ab6a6aa82af25a5682f56e00361e',
//     raw: {
//       data: '0x000000000000000000000000de29485df7e941866442ceb25dce1b9c64d02a2600000000000000000000000000000000000000000000000000000000000013880000000000000000000000000000000000000000000000000000000000000000',
//       topics: [
//         '0x0b1251cf7e5e829a5628351a2e2e73a37ce3ab6a6aa82af25a5682f56e00361e'
//       ]
//     }
//   }
