# Honeypot API Documentation

Use the Honeypot API to integrate honeypot checks into your product. Currently, API authentication is not required. You can skip the authentication steps. Quickstart

---

## Terms of Service
Please read the Terms of Service before using the API.

---

## Getting started
To get started, retrieve your API key. IMPORTANT! API Key system is not yet implemented. Link will not work. You do NOT need to provide an API key to use the API at this time. Please keep an eye out on t.me for updates. Get your API key

### Guides

### Authentication
Learn how to authenticate your API requests. Read more

### Chains
See what chains and exchanges are supported by the API. Read more

### Errors
Read about the different types of errors returned by the API. Read more

### Premium API
Learn about the premium API offered by Honeypot API. Read more

## Resources

### Honeypot Checks
Learn how to check if a token is a honeypot or not, and get the various details, such as taxes and gas for a token.

### Contracts
Learn about leveraging our powerful system to check if a contract is truly open source.

### Pairs
Learn about retrieving pair information using the Honeypot API.

### Top Holders
Learn about retrieving the top holders of a token using the Honeypot API.

---

## API Terms and Conditions

Last Update: 2023-12-05 Acceptance of Terms: The user (“User”) agrees that by accessing and using the Application Programming Interface (API), they are affirming their acceptance of and compliance with these Terms and Conditions (Terms). These Terms constitute a legally binding agreement between the User and honeypot.is ("We", "Us", "Our", "honeypot.is"). The use of the API is subject to these Terms, and any use of the API constitutes a declaration of the User’s consent to all terms and conditions contained herein.

## Resale Prohibition

Users are expressly prohibited from reselling, leasing, or sublicensing the API or any of its components to third parties. Any attempt to resell the API will be considered a breach of these Terms and may result in immediate termination of the User’s access to the API.

## Third-Party Restriction

Users are not permitted to provide, disclose, or otherwise make available any portion of the API or its functionalities to third parties. This includes but is not limited to, sharing API keys, documentation, or functionalities in any form.

## Non-Transferability

The rights granted to the User under these Terms are non-transferable. The User may not delegate, assign, or transfer their rights, licenses, or obligations under these Terms to any other party, either voluntarily or involuntarily, without prior written consent from honeypot.is.

## Competition Clause

The User is expressly prohibited from utilizing the API in the development, production, or marketing of a product or service primarily intended to be competitive with the products or services offered by honeypot.is.

## Intellectual Property Rights

All intellectual property rights in and to the API, including but not limited to copyrights, trademarks, patents, trade secrets, and any other proprietary rights, shall remain the sole property of honeypot.is. The User is granted a limited, non-exclusive, non-transferable license to use the API in accordance with these Terms. No rights are granted to the User beyond what is explicitly set forth herein, and any unauthorized use of the API’s intellectual property is a violation of these Terms.

## Termination of Use

We reserve the right, at our sole discretion, to terminate or suspend the User’s access to the API at any time, with or without notice, and without liability. This right may be exercised for any reason deemed appropriate by us, including but not limited to breaches of these Terms, actions that may harm us or other users, or any other circumstances where continued provision of access is not in the our best interest.

## Limitation of Liability

honeypot.is shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from the User’s access to or use of or inability to access or use the API.

## Amendments to Terms

We reserve the right to amend these Terms at any time. All amendments will be posted online and effective immediately upon posting. Continued use of the API by the User after any such amendments constitutes acceptance of the new Terms.

## Agreement

These Terms represent the entire understanding between the User and honeypot.is regarding the use of the API and supersede all prior agreements and understandings, written or oral. By using the API, the User acknowledges that they have read, understood, and agreed to these Terms.

# Quickstart

This guide will get you all set up and ready to use the Honeypot API. We’ll cover how to get started and how to make your first API request. We'll also look at where to go next to find all the information you need to take full advantage of our powerful API. Before you can make requests to the Honeypot API, you will need to grab your API key from your dashboard. You find it under Settings » API. API Keys are currently not required - please leave the API key out of your requests in order. This will change in the near future.

## Client

All Honeypot requests are made through HTTPS requests to the api.honeypot.is domain. All responses are returned as JSON objects. You can use any HTTP capable client to make requests to the API.

```
# cURL is most likely already installed on your machine
curl --version
```

### Making your first API request
After you've gotten your API key, you can start making requests to the Honeypot API. Below, you can see how to send a GET request to the IsHoneypot endpoint to check if a token is a honeypot. GET /v2/IsHoneypot

```
curl -G https://api.honeypot.is/v2/IsHoneypot \
  -H "X-API-KEY: {APIKEY}" \
  -d address=0x0
```

Read the docs for the IsHoneypot endpoint
What's next?

Great, you're now set up with an API client and have made your first request to the API. Here are a few links that might be handy as you venture further into the Honeypot.is API:

Grab your API key from the dashboard
Learn how to authenticate your requests

Check out the IsHoneypot endpoint
Learn about the different error messages in Honeypot.is

### Authorization
Currently API keys are not required. Leave the API key fields out and your requests will go through fine. Keep an eye out on t.me for updates. In this guide, we’ll look at how authorization works. Honeypot API requires API keys to be passed. API Keys can be passed through the header or as a parameter while making the request — Header is the recommended way.

### Header Authorization
With header authorization, you pass your API token as an X-API-KEY header. Here's how to authenticate using cURL:

Example request with basic auth
```
curl https://api.honeypot.is/v2/IsHoneypot \
  -H "X-API-KEY: {APIKEY}"
```

### Form Parameter Authorization
If you wish, you may pass the API Key as a form parameter apiKey while making the request. This is not recommended. Here's how to add the token as a form parameter using cURL:

Example request with bearer token
```
curl https://api.honeypot.is/v2/IsHoneypot \
  -d "apiKey={APIKEY}" \
  -d "address=0x0"
```
Always keep your API Key safe and reset it if you suspect it has been compromised.

### Errors
In this guide, we will talk about what happens when something goes wrong while you work with the API. Mistakes happen, and mostly they will be yours, not ours. Let's look at some status codes and error types you might encounter. You can tell if your request was successful by checking the status code when receiving an API response. If a response comes back unsuccessful, you can use the error type and error message to figure out what has gone wrong and do some rudimentary debugging (before contacting support). If you experience any errors, feel free to reach out to Honeypot.is support. We are always happy to help!

1. Status codes

Here is a list of the different categories of status codes returned by the Honeypot API. Use these to understand if a request was successful.
- 2xx – A 2xx status code indicates a successful response.
- 4xx – A 4xx status code indicates a client error — this means it's a you problem.
- 5xx – A 5xx status code indicates a server error — you won't be seeing these.

2. Error types
Whenever a request is unsuccessful, the Honeypot API will return an error response with an error type and message. You can use this information to understand better what has gone wrong and how to fix it. Most of the error messages are pretty helpful and actionable. Some of the older endpoints, such as legacy endpoints or some of the /v1 endpoints, might return a different error type. We are working on updating all calls to /v2 endpoints with more helpful error messages.

3. Error response
```
{
  "code": 400,
  "error": "invalid token address"
}
```

### Chains
- Currently, Honeypot.is only supports Ethereum, Binance Smart Chain, and Base. We do wish to expand our support, but adding more chains is costly in both time and effort, so we only do it when there is enough demand.

#### Exchanges
Honeypot.is currently only supports Uniswap V2 and Uniswap V3 based exchanges. Current supported exchanges are:
- Uniswap V2
- Sushiswap
- Pancakeswap
- Bakeryswap
- BiSwap

This list isn't exhaustive, and we are always happy to add more exchanges (and actually have a few more than listed). Please reach out to us on Telegram if you want a DEX to be added.

### Premium API

The Premium API endpoints are only available to Pro plans and above. Premium API endpoints provide extra information that we have available for our users. Those endpoints are not guaranteed to be available at all times and might be removed or changed at any time. Premium API endpoints may have different rate limits than what your plan allows for the regular API endpoints. This is simply because some of the premium API endpoints are very expensive to run and we need to limit the amount of requests to them. As we optimize our infrastructure, we will be able to increase the rate limits. We are currently working on expanding the set of Premium API calls. The Premium API/Pro plans are not yet available. This is planned in the near future. Please join t.me for API news.

### Summary Flags

List of flags that are present in the summary response from the IsHoneypot Summary endpoint. Note that this is present in the summary.flags (and not the root-level flags field). The original flags field is present for legacy reasons; however, because the original flags were not very informative, it is recommended to use summary.flags instead.

### Severity

Each flag contains a severity and severity index.
Possible values: "info" (4), "low" (8), "medium" (12), "high" (16), "critical" (20).
There's a gap between the severity index values to allow for future values. The severity index is always a positive integer.

The severity for a flag can change over time.

In the API response, the severity is in lowercase. Example of a flag in the response:

```
{
  "flag": "TRANSFER_BLOCKED",
  "description": "Normal transfers between wallets are blocked, those are non-DEX transactions.",
  "severity": "medium",
  "severityIndex": 12
}
```

The description is the English description of the flag, and can often change or be dynamic.
Flags can be added/removed, as well as their threshold for being triggered can change. If precision is required, it is recommended to use the results from the IsHoneypot endpoint instead.

### Flags
```
high_siphon_rate (SEVERITY: CRITICAL – 20) – >10% of users' wallets were siphoned (tokens disappeared from their wallets).
medium_siphon_rate (SEVERITY: HIGH – 16) – Some of the users' wallets were siphoned.
high_fail_rate (SEVERITY: CRITICAL – 20) – A very high amount of users cannot sell their tokens.
medium_fail_rate (SEVERITY: HIGH – 16) – A high amount of users cannot sell their tokens.
low_fail_rate (SEVERITY: MEDIUM – 12) – Some users cannot sell their tokens.
transfer_blocked (SEVERITY: MEDIUM – 12) – Normal transfers between wallets are blocked (non-DEX transactions).
extremely_high_taxes (SEVERITY: CRITICAL – 20) – The taxes on the token are extremely high, making it effectively a honeypot. (Actual rate varies, but generally >50%.)
high_tax (SEVERITY: HIGH – 16) – The average tax is very high (>40%).
medium_tax (SEVERITY: LOW – 8) – The average tax is quite high (>21%).
high_gas (SEVERITY: LOW – 8) – The gas usage for selling is very high (around 3.5M gas), meaning the transaction cost for selling will be high.
medium_gas (SEVERITY: INFO – 4) – The gas usage for selling is quite high (around 2M gas), meaning the transaction cost for selling will be high.
all_snipers_honeypot (SEVERITY: INFO – 4) – All snipers are marked as honeypots (blacklisted). If the token just launched, extra caution is advised. (Sniper detection still needs some improvements.)
some_snipers_honeypot (SEVERITY: INFO – 4) – Some of the snipers were blacklisted, but not all.
effective_honeypot_low_sell_limit (SEVERITY: CRITICAL – 20) – The sell limit for the token is so low, it's effectively a honeypot.
extremely_low_sell_limit (SEVERITY: CRITICAL – 20) – The sell limit for the token is extremely low. (Threshold is very low, so most likely a honeypot; hence the severity is critical.)
low_sell_limit (SEVERITY: CRITICAL – 20) – The sell limit for the token is low. (Threshold is very low, so most likely a honeypot; hence the severity is critical.)
one_sell_per_block_limit (SEVERITY: MEDIUM – 12) – Only one sell per block is allowed – this limit is shared by everyone (only one user can sell in a block). This is often found in tax farms and broken tokens.
closed_source (SEVERITY: HIGH – 16) – The source code is not available, allowing for hidden functionality.
custom_token_info (SEVERITY: INFO – 4) – Any extra information exclusively about the token. This is usually manually added, hence the name. It could be anything. (More information regarding this flag will be added as we develop this more.)
```

### Versioning & API Changes

Honeypot.is tries to be as stable as possible, doing its best to avoid breaking changes unless they are absolutely necessary.
Changes to API endpoints

We will not remove data or change existing data structures for current endpoints. We will only add new fields or endpoints. As such, make sure you can handle new fields being added to existing endpoints. We will frequently add new fields to existing endpoints, as we are constantly improving, and versioning for each update is not sustainable. If this is a problem for you, please let us know and we can work something out. All changes will be announced in our Telegram channel: t.me

### API Deprecation

Our API is versioned, and we will try to keep older versions of the API available for as long as possible. We will always announce ahead of time when we have to deprecate an API endpoint. Currently, V2 is the latest version of the API. Some endpoints are still only available in V1, but we will be migrating them to V2 with various improvements over time. We have no intention to deprecate V1 in the near future, but we will announce it ahead of time if we do.

### Change Log
This document contains a high-level overview of changes for the API endpoints. Smaller updates will be posted in the Telegram channel: t.me

1. 2024/04/21
Docs: fixed incorrect keys risk_level and severity_index to their correct notation riskLevel and severityIndex.

2. 2024/04/20
Added support for Base chain.

3. 2024/03/22
Added summary object to response in IsHoneypot endpoint. It's a convenient way of getting the most important information about the contract. 

More Info
Added airdropSummary object to response in IsHoneypot endpoint for each token. (Docs do not yet reflect this change.)

4. 2023/12/05
Added contractCode to response in IsHoneypot endpoint. Contains the open source and proxy information about the contract. More Info Example:

USDC Example
```
"contractCode": {
    "openSource": true,
    "rootOpenSource": true,
    "isProxy": true,
    "hasProxyCalls": true
},
```

5. 2023/08/19

Added total holders to token data in the IsHoneypot endpoint. Example:
USDC Example
```
"token": {
    "name": "USD Coin",
    "symbol": "USDC",
    "decimals": 6,
    "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "totalHolders": 1755864
},
```

### Honeypot Checks
IMPORTANT! API Key system is not yet implemented. You do NOT need to provide an API key to use the API at this time. Please keep an eye out on t.me for updates. Honeypot checks is the core part of Honeypot.is, the very reason that this project exists. On this page we'll dive into the 
IsHoneypot endpoint and its detailed response. GET /v2/IsHoneypot

1. Check a token
This endpoint allows you to retrieve honeypot details for a token. Please continue reading below for explanation of the response. The sample response includes fake data to showcase potential responses.

2. Required attributes
address (address) – The address of the token you want to check. Also supports the pair/pool address.

3. Optional attributes
- chainID (integer) – The chain you want to check the token on. If not specified, it will try to find the most suitable chain based on liquidity.

- pair (address) – The pair address you want to check with. If not specified, it will try to find the most suitable pair based on liquidity.

- simulateLiquidity (bool) – If set to true, the endpoint will try to simulate liquidity for the token if no pair exists. If there is a pair for the token, it will use the pair instead of simulating. To force simulate liquidity, see forceSimulateLiquidity.
NOTE: Requires chainID.

- forceSimulateLiquidity (bool) – If set to true, the endpoint will try to simulate liquidity for the token. This is useful when you want to check a token that is not yet listed on any DEX.
NOTE: Requires chainID.

### Request
```
GET /v2/IsHoneypot
curl -G https://api.honeypot.is/v2/IsHoneypot \
  -H "X-API-KEY: {APIKEY}" \
  -d address=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
```

### Response

```
{
  "token": {
      "name": "USD Coin",
      "symbol": "USDC",
      "decimals": 6,
      "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "totalHolders": 1755847
  },
  "withToken": {
      "name": "Ether",
      "symbol": "ETH",
      "decimals": 18,
      "address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "totalHolders": 671397
  },
  "summary": {
      "risk": "very_low",
      "riskLevel": 0
  },
  "simulationSuccess": true,
  // "simulationError": "Insufficient liquidity for this trade."
  "honeypotResult": {
      "isHoneypot": false
      // "honeypotReason": "PancakeSwap: TRANSFER_FROM_FAILED"
  },
  "simulationResult": {
      // USDC doesn't actually have maxBuy and maxSell, but this is just an example.
      "maxBuy": {
          "token": 500000,
          "tokenWei": "500000000000000",
          "withToken": 9.62705611028878,
          "withTokenWei": "9627056110288779597"
      },
      "maxSell": {
          "token": 500000,
          "tokenWei": "500000000000000",
          "withToken": 9.62705611028878,
          "withTokenWei": "9627056110288779597"
      },
      "buyTax": 0,
      "sellTax": 0,
      "transferTax": 0,
      "buyGas": "154591",
      "sellGas": "107886"
  },
  "holderAnalysis": {
      // NOTE: This is NOT the number of holders for the token.
      // This is only how many holders we are analyzing.
      // Look at the "token" section for the actual number of holders.
      "holders": "2",
      "successful": "2",
      "failed": "0",
      "siphoned": "0",
      "averageTax": 0,
      "averageGas": 134250.5,
      "highestTax": 0,
      "highTaxWallets": "0",
      "taxDistribution": [
          {
              "tax": 0,
              "count": 2
          }
      ]
  },
  "flags": [],
  "contractCode": {
      "openSource": true,
      "rootOpenSource": true,
      "isProxy": true,
      "hasProxyCalls": true
  },
  "chain": {
      "id": "1",
      "name": "Ethereum",
      "shortName": "ETH",
      "currency": "ETH"
  },
  "router": "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  "pair": {
      "pair": {
          "name": "Uniswap V2: USDC-WETH",
          "address": "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc",
          "token0": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "token1": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
          // Type will be either "UniswapV2" or "UniswapV3", even on PancakeSwap.
          "type": "UniswapV2"
      },
      "chainId": "1",
      "reserves0": "37345754334572",
      "reserves1": "18943616626757258383905",
      "liquidity": 74766200.17781314, // USD Value
      "router": "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
      "createdAtTimestamp": "1620250931",
      "creationTxHash": "0x125e0b641d4a4b08806bf52c0c6757648c9963bcda8681e4f996f09e00d4c2cc"
  },
  "pairAddress": "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc"
}
```

### Summary

The summary object contains a brief summary of the results; it is an easy way to quickly parse the response. Most of the summary is derived from other data in the response. The summary object is guaranteed to be present. riskLevel is not present if risk is unknown. flags is an array (it may be empty or missing) of flags. A list of flags and their descriptions can be found in the Summary Flags section. Flags can be warnings or purely informational. The risk field is the risk level of the token. It is always present. The risk will be one of: unknown, very_low, low, medium, high, very_high, or honeypot. NOTE: The summary is still new. If you see any inconsistencies or have suggestions, please let us know. 

We will be expanding what the risk level is influenced by. It is recommended to use the riskLevel field instead of the risk field for programmatic use, as we may expand the number of risk categories in the future.
unknown – The risk level of the token is unknown. (riskLevel is not present.)

- very_low – The token is very low risk. Only whitelisted tokens can get this rating (e.g., WETH, USDC, USDT etc.). riskLevel is 0.
- low – The token is low risk. Honeypot didn't find anything suspicious about the token. riskLevel is between 1 and 19 (inclusive).
NOTE: In the future, additional requirements may be added, such as liquidity burned/locked, or a certain amount of time since launch.
- medium – The token is medium risk. There are some potential issues. Caution is advised. riskLevel is between 20 and 59 (inclusive).
- high – The token is high risk. There are some issues that need to be considered. Caution is advised. riskLevel is between 60 and 79 (inclusive).
- very_high – The token is very high risk. It is likely a honeypot, but not certain yet. riskLevel is between 80 and 89 (inclusive).
- honeypot – The token is almost certainly a honeypot. riskLevel is between 90 and 100 (inclusive).

### Examples of summary outputs
Example (Honeypot):

```
"summary": {
    "risk": "honeypot",
    "riskLevel": 100,
    "flags": [
      {
        "flag": "high_fail_rate",
        "description": "A very high amount of users can not sell their tokens.",
        "severity": "critical",
        "severityIndex": 20
      },
      {
        "flag": "CLOSED_SOURCE",
        "description": "The source code is not available, allowing for hidden functionality.",
        "severity": "high",
        "severityIndex": 16
      }
    ]
}
```

### Simulation Success
The simulationSuccess field is a boolean that indicates whether the simulation was successful. If it is false, the simulationError field will contain the error message. If simulationSuccess is true, then the honeypotResult and simulationResult objects will be present. However, honeypotResult can still be present even if the simulation was not successful, if there's enough data to determine the honeypot status of the token from other sources such as holder analysis.

Example response (Simulation Success)
```
// ...
"simulationSuccess": true,
// ...
Honeypot Result
The honeypotResult object contains the honeypot status of the token. This field is not guaranteed to be present (for example, in cases where we were unable to check the status of the token). If honeypotResult.isHoneypot is true, the honeypotResult.honeypotReason field will contain the reason why it is a honeypot.
Example response (Honeypot)
// ...
"honeypotResult": {
    "isHoneypot": true,
    "honeypotReason": "Insufficient liquidity"
},
// ...
```

### Simulation Result

The simulationResult object contains the simulation result of the token. This field is not guaranteed to be present (for example, if the token is a honeypot or the simulation failed). The maxBuy and maxSell objects are not guaranteed to be present. They will only be present if we detected them. If the token has unlimited max buy or sell, those fields will not be present. The token and tokenWei refer to the token that is being scanned/tested. The withToken and withTokenWei refer to the other token in the pair that is being used to buy the token. The token and withToken values are adjusted based on the decimals of the token. The tokenWei and withTokenWei are the raw values.

Example response
Sample 1:
```
"simulationResult": {
    "maxBuy": {
        "token": 500000,
        "tokenWei": "500000000000000",
        "withToken": 9.62705611028878,
        "withTokenWei": "9627056110288779597"
    },
    "maxSell": {
        "token": 500000,
        "tokenWei": "500000000000000",
        "withToken": 9.62705611028878,
        "withTokenWei": "9627056110288779597"
    },
    "buyTax": 0,
    "sellTax": 0,
    "transferTax": 0,
    "buyGas": "154591",
    "sellGas": "107886"
},
```

### Holder Analysis

The holderAnalysis object contains the analysis of the holders of the token. (Honeypot result already takes this object into consideration. For most users, you can disregard this object. It is provided for those that want to apply their own criteria.) This field is not guaranteed to be present. The holders field is the number of holders that we have analyzed (NOT the total number of holders for the token). The successful field is the number of holders that can sell their holdings. The failed field is the number of holders that cannot sell their holdings. The siphoned field is the number of holders that have been siphoned (their tokens have been transferred without their consent). (In some very rare cases, legitimate transfers are marked as siphoned — we are working on reducing the false positives.) The averageTax field is the average tax that the holders have to pay when they sell their holdings. The averageGas field is the average gas that the holders have to pay when they sell their holdings. The highestTax field is the highest tax that a holder would have to pay. The highTaxWallets field is the number of wallets that have to pay ≥50% tax. The taxDistribution field is an array of objects that contains the tax percentage (rounded to a whole number) and how many wallets have to pay that percentage.

Example response
Sample 1:
```
"holderAnalysis": {
    "holders": "2", // This is NOT the number of holders for the token.
    "successful": "2",
    "failed": "0",
    "siphoned": "0",
    "averageTax": 0,
    "averageGas": 134250.5,
    "highestTax": 0,
    "highTaxWallets": "0",
    "taxDistribution": [
      {
        "tax": 0,
        "count": 2
      }
    ]
},
```

### Flags
The flags field is an array of strings. It contains warnings about the token that we have detected. It's recommended to use the summary.flags instead. This field is deprecated, but will still be present for backwards compatibility.

Example response
Sample 1:

```
"flags": ["TRANSFER_BLOCKED", "EXTREMELY_HIGH_TAXES"],
```

### Contract Code

The contractCode object contains information about the contract code of the token. (Not guaranteed to be present.) Currently, it only indicates whether the code is open source and whether it's a proxy contract. Note: The results from here are cached and may be outdated. Look at the Contract Verification endpoints if you want more up-to-date information.
openSource – If the contract is open source. Unlike other detectors, it's not enough for the token itself to be open source; this requires that every single contract called during the buy/sell process is open source.
rootOpenSource – If the root contract is open source. (This is the token contract that is being scanned.)
isProxy – If the contract is a proxy contract (i.e., if a delegatecall is executed from the token contract).
hasProxyCalls – If the contract has proxy calls. This differs from isProxy in that this is true if there is any delegatecall in the execution path, not just from the token contract.

Example 1: TOKEN -> DELEGATECALL CONTRACT A → hasProxyCalls = true, isProxy = true.
Example 2: TOKEN -> CALL CONTRACT A -> DELEGATECALL CONTRACT B → hasProxyCalls = true, isProxy = false.

Example response
Sample 1:
```
// ...
"contractCode": {
    "openSource": true,
    "rootOpenSource": true,
    "isProxy": true,
    "hasProxyCalls": true
},
// ...
```

### Contract Verification

Contract Verification checks if the contract is open source or not. No actual analysis of the contract happens in this endpoint and it is not a substitute for an audit. It is a simple check to see if the contract is open source or not. However, unlike many other contract verification tools, we do not simply check the contract for the address specified. We check every contract that the target contract makes calls to. As such, we require the contract to be tradeable in order to get a full call stack of the contract – so that we can determine what contracts it calls. 

```
GET /v2/GetContractVerification
```

Check if a contract is open source
This endpoint allows you to retrieve a list of contracts that are called by the contract you specify, and whether they are open source or not. (“Root contract” refers to the address being checked.)

#### Required attributes
- address (address) – The address of the contract you want to check.

#### Optional attributes
- chainID (integer) – The chain you want to check the contract on. If not specified, it will try to find the most suitable chain based on liquidity.

### Response

To get the list of all the external contracts called, this endpoint attempts to simulate a buy/sell transaction to get the list of contracts being called. If the simulation fails, fullCheckPerformed will be false and summary.contractsOpenSource.contractCalls may not be present. summary contains a summary of the results, generated from contractsOpenSource and contractCalls. summary.isOpenSource is true if the root contract and every contract it calls is open sourced. summary.hasProxyCalls is true if there are any delegatecalls made in the call tree. contractsOpenSource contains a list of contracts that are called in the tree, and whether they are open source or not. There is no guarantee whether the root contract will be present or not in this list. contractCalls contains a list of all unique calls made in the call tree, in no specific order.

Request

```
GET /v2/GetContractVerification
curl -G https://api.honeypot.is/v2/GetContractVerification \
  -H "X-API-KEY: {APIKEY}" \
  -d address=0x8a50b28242a88e051a0c08b11050aae6a663493c
```

Response
```
{
  "isContract": true, // If the address being checked is a contract.
  "isRootOpenSource": true, // If the address being checked is open source.
  "fullCheckPerformed": true, // If the full check was performed. If false, summary.contractsOpenSource.contractCalls may not be present.
  "summary": {
      "isOpenSource": true, // If all the contracts called by the contract are open source, as well as the root contract.
      "hasProxyCalls": false // If there are any delegatecalls made.
  },
  // List of all contracts called and if they are open source or not.
  "contractsOpenSource": {
      "0x8a50B28242A88e051A0C08b11050AAE6A663493C": true
  },
  "contractCalls": []
}
```

### Pairs
Honeypot.is provides helper endpoints to find pairs for a token. GET /v1/GetPairs

### Get Pairs
This endpoint allows you to retrieve a list of pairs for a token. Currently, the endpoint is limited to returning 10 pairs. The /v2/ version of this endpoint will support a user-specified limit.

### Required attributes

address (address) – The address of the token to retrieve pairs for.
Optional attributes
chainID (integer) – The chain you want to check the token on. If not specified, it will include pairs for all chains.

Request

```
GET /v1/GetPairs
curl -G https://api.honeypot.is/v1/GetPairs \
  -H "X-API-KEY: {APIKEY}" \
  -d address=0x6982508145454Ce325dDbE47a25d4ec3d2311933 \
  -d chainID=1
```

Response
```
[
  {
      "ChainID": 1,
      "Pair": {
          "Name": "Uniswap V2: PEPE-WETH",
          "Tokens": [
              "0x6982508145454ce325ddbe47a25d4ec3d2311933",
              "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
          ],
          "Address": "0xa43fe16908251ee70ef74718545e4fe6c5ccec9f"
      },
      "Reserves": [
          2309863147202366390632917740976,
          3657182645473588411835
      ],
      "Liquidity": 13795258.656990923,
      "Router": "0x7a250d5630b4cf539739df2c5dacb4c659f2488d"
  },
  // The remaining 9 pairs...
]
```

### Top Holders

This documentation is incomplete. We are working on it. If you have any questions, please contact us.
```
GET /v1/TopHolders
```

### Get Top Holders
This endpoint retrieves the top 50 holders for the specified token. The Premium API allows retrieving more holders. (Alias is not currently set.)

#### Required attributes
- address (address) – The address of the token to retrieve holders for.
#### Optional attributes
- chainID (integer) – The chain you want to check the token on. (Unlike some other endpoints, this field is required here.)

Request
```
GET /v1/TopHolders
curl -G https://api.honeypot.is/v1/TopHolders \
  -H "X-API-KEY: {APIKEY}" \
  -d address=0xe786c0da51a21c8f7ec91c9889e2df3f21ee1747 \
  -d chainID=1
```

Response
```
{
    "totalSupply": "28247199602143667875022",
    "holders": [
        {
            "address": "0x663A5C229c09b049E36dCc11a9B0d4a8Eb9db214",
            "balance": "27830592101166458317451",
            "alias": "",
            "isContract": true
        },
        {
            "address": "0x04bDa42de3bc32Abb00df46004204424d4Cf8287",
            "balance": "281117091930974326438",
            "alias": "",
            "isContract": false
        },
        {
            "address": "0x16BCA6D06425daa0B0724086eB1e3b7D499ef403",
            "balance": "135490409046235230133",
            "alias": "",
            "isContract": false
        },
        {
            "address": "0x0000000000000000000000000000000000000000",
            "balance": "1000",
            "alias": "",
            "isContract": false
        }
    ]
}
```