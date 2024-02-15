require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require('hardhat-contract-sizer');
require("./task/gametask");

const bscMainnetUrl = process.env.BSC_MAINNET_URL
const bscTestnetUrl = process.env.BSC_TESTNET_URL
const goerliUrl = process.env.GOERLI_URL
const mumbaiUrl = process.env.MUMBAI_URL
const blastTestnetUrl = process.env.BLAST_TESTNET_URL

let accounts = [];
const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY
if (ownerPrivateKey) {
  accounts.push(ownerPrivateKey)
}
const gamblerPrivateKey1 = process.env.GAMBLER_PRIVATE_KEY_1
if (gamblerPrivateKey1) {
  accounts.push(gamblerPrivateKey1)
}
const gamblerPrivateKey2 = process.env.GAMBLER_PRIVATE_KEY_2
if (gamblerPrivateKey2) {
  accounts.push(gamblerPrivateKey2)
}
const gamblerPrivateKey3 = process.env.GAMBLER_PRIVATE_KEY_3
if (gamblerPrivateKey3) {
  accounts.push(gamblerPrivateKey3)
}
const gamblerPrivateKey4 = process.env.GAMBLER_PRIVATE_KEY_4
if (gamblerPrivateKey4) {
  accounts.push(gamblerPrivateKey4)
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  defaultNetwork: "goerli",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      chainId: 1337,
      url: "http://127.0.0.1:8545",
      accounts,
    },
    bsc_testnet: {
      chainId: 97,
      url: bscTestnetUrl || "",
      accounts,
    },
    bsc_mainnet: {
      chainId: 56,
      url: bscMainnetUrl || "",
      accounts,
    },
    goerli: {
      chainId: 5,
      url: goerliUrl || "",
      accounts,
    },
    mumbai: {
      chainId: 80001,
      url: mumbaiUrl || "",
      accounts,
    },
    blast_testnet: {
      chainId: 168587773,
      url: blastTestnetUrl || "",
      accounts,
    }
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
    only: [':MekaGame$'],
  }
};