export const CommitReveal2L2_ABI = [
  {
    type: "function",
    name: "getActivatedOperators",
    inputs: [],
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getActivatedOperatorsLength",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getCurRoundAndStartTime",
    inputs: [],
    outputs: [
      { name: "", type: "uint256" },
      { name: "", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "s_currentRound",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "estimateRequestPrice",
    inputs: [
      { name: "callbackGasLimit", type: "uint32" },
      { name: "gasPrice", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "s_flatFee",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

export const ConsumerExampleV2_ABI = [
  {
    type: "function",
    name: "requestRandomNumber",
    inputs: [],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "s_requestCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getMainInfos",
    inputs: [],
    outputs: [
      { name: "requestCount", type: "uint256" },
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "requestId", type: "uint256" },
          { name: "requester", type: "address" },
          { name: "fulfillBlockNumber", type: "uint256" },
          { name: "randomNumber", type: "uint256" },
          { name: "isRefunded", type: "bool" },
          { name: "requestFee", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getDetailInfo",
    inputs: [{ name: "requestId", type: "uint256" }],
    outputs: [
      { name: "requester", type: "address" },
      { name: "requestFee", type: "uint256" },
      { name: "requestBlockNumber", type: "uint256" },
      { name: "fulfillBlockNumber", type: "uint256" },
      { name: "randomNumber", type: "uint256" },
      { name: "isRefunded", type: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getCommitReveal2Address",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "CALLBACK_GAS_LIMIT",
    inputs: [],
    outputs: [{ name: "", type: "uint32" }],
    stateMutability: "view",
  },
] as const;

export const THANOS_SEPOLIA_CHAIN = {
  chainId: 111551119090,
  chainIdHex: "0x19f8f6fef2",
  name: "Thanos Sepolia",
  rpcUrl: "https://rpc.thanos-sepolia.tokamak.network",
  explorerUrl: "https://explorer.thanos-sepolia.tokamak.network",
  nativeCurrency: {
    name: "TON",
    symbol: "TON",
    decimals: 18,
  },
};
