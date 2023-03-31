import { DeployProxyOptions } from '@openzeppelin/hardhat-upgrades/dist/utils';
import { Contract, ContractFactory, ContractTransaction } from 'ethers';
import hre, { defender, ethers, upgrades } from 'hardhat';
import { getRuntimeConfig } from './config.util';

/**
 *
 * @param DeployContractName
 * @param deployContract
 * @returns Contract
 */
async function _deploy(
  DeployContractName: string,
  deployContract: Contract
): Promise<Contract> {
  // We get the contract to deploy
  console.log('[deploy contract]:deploy [%s] start', DeployContractName);
  const [deployer] = await hre.ethers.getSigners();
  console.log('[deploy contract]:deployer address', deployer.address);
  const deployerBalance = await deployer.getBalance();
  console.log(
    '[deploy contract]:deployer balance before',
    hre.ethers.utils.formatEther(deployerBalance)
  );
  await deployContract.deployed();

  const deployerBalanceAfter = await deployer.getBalance();
  console.log(
    '[deploy contract]:deployer balance after',
    hre.ethers.utils.formatEther(deployerBalanceAfter)
  );
  console.log(
    '[deploy contract]:deploy gas fee',
    ethers.utils.formatEther(deployerBalance.sub(deployerBalanceAfter))
  );
  console.log(
    '[deploy contract]:deploy complete! contract: [%s] deployed to: %s',
    DeployContractName,
    deployContract.address
  );
  return deployContract;
}
/**
 * deploy contract(not upgradeable)
 * @param DeployContractName  contract name
 * @param args  contract args
 * @returns  Contract
 */
export async function deployNormal(
  DeployContractName: string,
  ...args: any[]
): Promise<Contract> {
  const DeployContract = await hre.ethers.getContractFactory(
    DeployContractName
  );
  const deployContract = await DeployContract.deploy(...args);
  return _deploy(DeployContractName, deployContract);
}

/**
 * deploy upgradeable contract
 * @param contractName contract name
 * @returns contract address
 */
export async function deployUpgradeProxy(
  contractName: string,
  args?: unknown[],
  opts?: DeployProxyOptions
): Promise<Contract> {
  const DeployContractName = contractName;
  const DeployContract = await hre.ethers.getContractFactory(
    DeployContractName
  );
  const deployContract = await upgrades.deployProxy(DeployContract, args, opts);
  return _deploy(DeployContractName, deployContract);
}
/**
 * update upgradeable contract
 * @param contractName contract name
 * @param contractAddress  contract address
 * @returns
 */
export async function deployUpgradeUpdate(
  contractName: string,
  contractAddress: string
): Promise<Contract> {
  console.log('[deploy contract]:deploy [%s] upgrade ...', contractName);
  const DeployContractName = contractName;
  const DeployContract = await getContractFactory(DeployContractName);
  const deployContract = await upgrades.upgradeProxy(
    contractAddress,
    DeployContract
  );
  return _deploy(DeployContractName, deployContract);
}

/**
 * update upgradeable contract (through defender proposal)
 * @param contractName contract name
 * @param contractAddress  contract address
 * @returns
 */
export async function deployUpgradeUpdateWithProposal(
  contractName: string,
  contractAddress: string
): Promise<void> {
  console.log('[deploy contract]:deploy [%s] upgrade ...', contractName);
  const Contract = await getContractFactory(contractName);
  console.log('Preparing proposal...');
  const runtimeConfig = getRuntimeConfig();
  console.log(
    'Upgrade proposal with multisig at:',
    runtimeConfig.upgradeDefenderMultiSigAddress
  );
  const proposal = await defender.proposeUpgrade(contractAddress, Contract, {
    multisig: runtimeConfig.upgradeDefenderMultiSigAddress,
  });
  console.log('Upgrade proposal created at:', proposal.url);
}

export async function getContractFactory(
  contractName: string
): Promise<ContractFactory> {
  return hre.ethers.getContractFactory(contractName);
}

async function deployGrantRoles(
  contract: Contract,
  roles: {
    roleId: string;
    roleName: string;
  }[],
  grantAddress: string
) {
  for (const role of roles) {
    await contract
      .grantRole(role.roleId, grantAddress)
      .then((tx: ContractTransaction) => tx.wait());
    console.log(
      `contract: ${contract.address}, grant: '${role.roleName} role' to address: ${grantAddress}`
    );
  }
}

async function deployRevokeRoles(
  contract: Contract,
  roles: {
    roleId: string;
    roleName: string;
  }[],
  revokeAddress: string
) {
  for (const role of roles) {
    await contract
      .revokeRole(role.roleId, revokeAddress)
      .then((tx: ContractTransaction) => tx.wait());
    console.log(
      `contract: ${contract.address}, revoke: '${role.roleName} role' from address: ${revokeAddress}`
    );
  }
}
export const deployUtil = {
  grantRoles: deployGrantRoles,
  revokeRoles: deployRevokeRoles,
};
