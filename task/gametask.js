const { BigNumber } = require("ethers");
const delay = require('delay');

const getMekabeta = async (hre, contract) => {
    let [owner] = await hre.ethers.getSigners();
    const MekaGame = await hre.ethers.getContractFactory("MekaGame", owner);
    let contractAddr;
    if (contract == null || contract == undefined || contract === "") {
      contractAddr = process.env.GAME_ADDRESS;
      if (contractAddr == null || contractAddr == undefined || contractAddr === "") {
        throw new Error("No game contract");
      }
    } else {
      contractAddr = contract;
    }
    let mekaGame = MekaGame.attach(contractAddr);
    return mekaGame;
}

const getGamblerMekaInvitor = async (hre, contract, gamblerIndex) => {
  let [, gambler1, gambler2, gambler3, gambler4] = await hre.ethers.getSigners();
  let gambler;
  if (gamblerIndex < 1 || gamblerIndex > 4) {
    throw new Error("Unsupported gambler index");
  }
  switch (Number(gamblerIndex)) {
    case 1:
      gambler = gambler1;
      break;
    case 2:
      gambler = gambler2;
      break;
    case 3:
      gambler = gambler3;
      break;
    case 4:
      gambler = gambler4;
      break;
  }
  const MekaGame = await hre.ethers.getContractFactory("MekaGame", gambler);
  let contractAddr;
  if (contract == null || contract == undefined || contract === "") {
    contractAddr = process.env.GAME_ADDRESS;
    if (contractAddr == null || contractAddr == undefined || contractAddr === "") {
      throw new Error("No game contract");
    }
  } else {
    contractAddr = contract;
  }
  let mekaInvitor = MekaGame.attach(contractAddr);
  return mekaInvitor;
}

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  const [owner] = await hre.ethers.getSigners();
  console.log("owner:", owner.address);

  console.log("======= Account List ========")
  for (const account of accounts) {
    console.log(account.address);
  }
});
  
task("betTable", "Print the bet table by address")
  .addOptionalParam("contract", "The contract address of Mekabeta")
  .addParam("address", "The address of the gambler")
  .setAction(async (taskArgs, hre) => {
    let mekaGame = await getMekabeta(hre, taskArgs.contract);
    let amount = await mekaGame.betTable(taskArgs.address);
    let gambler = taskArgs.address;
    amount = hre.ethers.utils.formatEther(amount);
    console.log(`${gambler} bet ${amount}`);
});

task("printBetAmount", "Print all of the bet amount")
  .addOptionalParam("contract", "The contract address of Mekabeta")
  .setAction(async (taskArgs, hre) => {
    let mekaGame = await getMekabeta(hre, taskArgs.contract);
    let bets = await mekaGame.printBetAmount();
    let period = bets[0].toString();
    let oddAmt = hre.ethers.utils.formatEther(bets[1].toString());
    let evenAmt = hre.ethers.utils.formatEther(bets[2].toString());
    console.log(`Current period is ${period}, total Odd is ${oddAmt} ether, total Even is ${evenAmt} ether`);
});

task("lottery", "Trigger the lottery")
  .addOptionalParam("contract", "The contract address of Mekabeta")
  .setAction(async (taskArgs, hre) => {
    let mekaGame = await getMekabeta(hre, taskArgs.contract);
    let period = await mekaGame.period();
    await mekaGame.lottery();
    console.log(`Trigger lottery ${period} success`);
});

task("printBetTable", "Print all of the bet table information")
  .addOptionalParam("contract", "The contract address of Mekabeta")
  .setAction(async (taskArgs, hre) => {
    let mekaGame = await getMekabeta(hre, taskArgs.contract);
    let oddTable = await mekaGame.printBetTable(true);
    let evenTable = await mekaGame.printBetTable(false);
    console.log("============= Odd Table =============");
    console.log(oddTable);
    console.log("============= Even Table =============");
    console.log(evenTable);
});

task("setFeeRate", "Set the fee rate when lottery")
  .addOptionalParam("contract", "The contract address of Mekabeta")
  .addParam("rate", "The value of fee")
  .setAction(async (taskArgs, hre) => {
    let mekaGame = await getMekabeta(hre, taskArgs.contract);
    await mekaGame.setFeeRate(taskArgs.rate);
    console.log("Setting new fee rate ...")
    await delay(5000);
    let feeRate = await mekaGame.feeRate();
    console.log(`New fee rate is ${feeRate}`);
});

task("feeRate", "Get the fee rate")
  .addOptionalParam("contract", "The contract address of Mekabeta")
  .setAction(async (taskArgs, hre) => {
    let mekaGame = await getMekabeta(hre, taskArgs.contract);
    let feeRate = await mekaGame.feeRate();
    console.log(`Fee rate is ${feeRate}`);
});

task("setTriggerNum", "Set the auto lottery trigger num")
  .addOptionalParam("contract", "The contract address of Mekabeta")
  .addParam("num", "The value of trigger num")
  .setAction(async (taskArgs, hre) => {
    let mekaGame = await getMekabeta(hre, taskArgs.contract);
    await mekaGame.setTriggerNum(taskArgs.num);
    console.log("Setting new trigger number ...")
    await delay(5000);
    let triggerNum = await mekaGame.triggerNum();
    console.log(`New trigger number is ${triggerNum}`);
});

task("triggerNum", "Get the trigger number")
  .addOptionalParam("contract", "The contract address of Mekabeta")
  .setAction(async (taskArgs, hre) => {
    let mekaGame = await getMekabeta(hre, taskArgs.contract);
    let triggerNum = await mekaGame.triggerNum();
    console.log(`Trigger number is ${triggerNum}`);
});

task("setBonusRate", "Set invitor's bonus rate of Medabeta")
  .addOptionalParam("contract", "The contract address of Mekabeta")
  .addParam("rate", "The invitor's bonus rate")
  .setAction(async (taskArgs, hre) => {
    let mekaGame = await getMekabeta(hre, taskArgs.contract);
    await mekaGame.setBonusRate(taskArgs.rate);
    await delay(5000);
    let bonusRate = await mekaGame.bonusRate();
    console.log(`The invitor's bonus rate is ${bonusRate}`);
});

task("bonusRate", "Get invitor's bonus rate")
  .addOptionalParam("contract", "The contract address of Mekabeta")
  .setAction(async (taskArgs, hre) => {
    let mekaGame = await getMekabeta(hre, taskArgs.contract);
    let bonusRate = await mekaGame.bonusRate();
    console.log(`The invitor's bonus rate is ${bonusRate}`);
});

task("setFeeReceiver", "Set fee receiver of platform")
  .addOptionalParam("contract", "The contract address of Mekabeta")
  .addParam("address", "The address of fee receiver")
  .setAction(async (taskArgs, hre) => {
    let mekaGame = await getMekabeta(hre, taskArgs.contract);
    await mekaGame.setFeeReceiver(taskArgs.address);
    await delay(5000);
    let receiver = await mekaGame.feeReceiver();
    console.log(`The fee receiver is ${receiver}`);
});

task("feeReceiver", "Get fee receiver of platform")
  .addOptionalParam("contract", "The contract address of Mekabeta")
  .setAction(async (taskArgs, hre) => {
    let mekaGame = await getMekabeta(hre, taskArgs.contract);
    let receiver = await mekaGame.feeReceiver();
    console.log(`The fee receiver is ${receiver}`);
});

task("invitor", "Print the invitor of the specified address")
  .addOptionalParam("contract", "The contract address of Mekabeta")
  .addParam("address", "The specified address want to query")
  .setAction(async (taskArgs, hre) => {
    let mekaInvitor = await getMekabeta(hre, taskArgs.contract);
    let invitor = await mekaInvitor.invitorMap(taskArgs.address);
    console.log(`The invitor of ${taskArgs.address} is ${invitor}`);
});

task("setInvitor", "Set the invitor")
  .addOptionalParam("contract", "The contract address of Mekabeta")
  .addParam("gambler", "The index of gambler in env config")
  .addParam("invitor", "The address of mekabeta contract")
  .setAction(async (taskArgs, hre) => {
    let mekaInvitor = await getGamblerMekaInvitor(hre, taskArgs.contract, taskArgs.gambler);
    await mekaInvitor.setInvitor(taskArgs.invitor);
});