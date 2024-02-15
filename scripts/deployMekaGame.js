const hre = require("hardhat");

async function main() {
  const [owner] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", owner.address);

  const feeReceiver = process.env.FEE_RECEIVER
  if (feeReceiver == null || feeReceiver == undefined) {
    console.log("未指定平台收益地址");
    return;
  }
  const MekaGame = await hre.ethers.getContractFactory("MekaGame", owner);
  const mekaGame = await MekaGame.deploy(feeReceiver, {gasLimit: 5000000});

  await mekaGame.deployed();

  console.log("MekaGame deployed to:", mekaGame.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});