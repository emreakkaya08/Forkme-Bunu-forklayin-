# XYProtocol contracts

## contract addresses

### eth mainnet

### eth testnet

- `TokenCENO`: `0x??`
  - [bscscan](https://bscscan.com/address/0x??)
- `TokenZOIC`: `0x??`
  - [bscscan](https://bscscan.com/address/0x??)
  
## how to develop and test

### Principle of development

#### TDD(Test-Driven Development)

The development process must strictly follow the principle of test-driven development, write test cases first, and then write the function implementation.

#### Code submission requires all test cases to pass

#### Incremental design

### Actual engineering development

#### Update With npm

```shell
git clone https://github.com/XYOrigin/XYProtocol.git
cd XYProtocol
npm install
```

The project structure is as follows

```bash
xyprotocol/
├── contracts          --- Contract source code directory, mainly store *.sol contract files
│   ├── HelloWorld.sol
│   └── ...
├── scripts            --- js script directory, mainly store deployment scripts.
│   ├── HelloWorld-deploy.js
│   └── ...
├── test               --- Contract unit test directory
│   ├── HelloWorld-test.js
│   └── ...
├── hardhat.config.js  --- hardhat configuration file
├── package.json
├── .env               --- Environment variable file (need to be created manually)
└── ...
```

## - Automated testing

Root directory add ```.env```  file

```shell
ARBITRUM_TESTNET_URL='https://endpoints.omniatech.io/v1/arbitrum/goerli/public'
ARBITRUM_TESTNET_DEPLOYER_PRIVATE_KEY='0xddf32a25932****************************'
ETH_TESTNET_URL='https://rpc.ankr.com/eth_goerli'
ETH_TESTNET_DEPLOYER_PRIVATE_KEY='0xddf32a25932****************************'
ZKSYNC_ERA_TESTNET_URL="https://testnet.era.zksync.dev"
ZKSYNC_ERA_TESTNET_DEPLOYER_PRIVATE_KEY="0xddf32a25932****************************"
BSC_TESTNET_URL='https://rpc.ankr.com/bsc_testnet_chapel/ac141fd7c92fef5b91821a38011b5073605c4d3c359e2c37b5efe857b324ac37'
BSC_TESTNET_DEPLOYER_PRIVATE_KEY='0xddf32a25932****************************'
```

Running Test Locally (Recommend)

```shell
npx hardhat test
```

Running Test On special test case

```shell
npx hardhat test --grep describeName
```

Running Test On Polygon Testnet

```shell
npx hardhat test --network mumbai
```

## Deployment

### Deploy contract to testnet or mainnet
CD Root directory

```shell
npx hardhat run --network mumbai ./scripts/HelloWorld-deploy.ts
```

```shell
npx hardhat run --network bsc_testnet ./scripts/HelloWorld-deploy.ts
npx hardhat run --network bsc_testnet filePath
```

### Record the address of the contract after deployment

```shell
HelloWorld deployed to:0x3F0528D040f31ace17a0c733469145928b9C88a4
```

Record `0x3F0528D040f31ace17a0c733469145928b9C88a4` to any place you like, which is convenient for the other service to call.

### Compile contract ABI

```shell
npm run compile
```

#### Generate contracts to the corresponding directory structure

````shell

```bash
contracts/
├── abi/
│   └── contracts/
│       ├── HelloWorld.sol/
│       │   ├── HelloWorld.json  ---abi description file
│       │   └── HelloWorld.ts    ---abi Typescript file
│       └── OtherXXX.sol/
│           ├── OtherXXX.json
│           └── OtherXXX.ts
└── ...
````

Copy the files in the `abi/` directory to the corresponding project for use

About the `abi/` directory, you can also use the `npm run compile` command to generate the `abi/` directory, and then copy the files in the `abi/` directory to the corresponding project for use.

### fork chain to local

```shell
npx ganache-cli --fork https://rpc.ankr.com/eth_goerli/ --networkId 1337
```

### Foundry test

```
forge test
```