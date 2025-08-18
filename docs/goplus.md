# Table of Contents

- [Introduction](#introduction)
- [GoPlus Security SDK](#goplus-security-sdk)
- [API Overview](#api-overview)
- [Supported Blockchains](#supported-blockchains)
- [Token Security API](#token-security-api)
- [Get token's security and risk data](#get-tokens-security-and-risk-data)
- [Malicious Address API](#malicious-address-api)
- [Check if the address is malicious](#check-if-the-address-is-malicious)
- [Approval Security API (v1)](#approval-security-api-v1)
- [Check if the approval is secure](#check-if-the-approval-is-secure)
- [Approval Security API (v2)](#approval-security-api-v2)
- [ERC-20 approvals of an address](#X7ad943bb896d7309ca3c8aceeead18b671466b6)
- [ERC-721 approvals of an address](#X64f7cf875ed969511a87e2ae5ca16e45f3e7a82)
- [ERC-1155 approvals of an address](#X4e2318d9165fb96ed0d8909d18a2b7386ad65c7)
- [Signature Data Decode API](#signature-data-decode-api)
- [Get ABI decode info](#get-abi-decode-info)
- [NFT Security API](#nft-security-api)
- [Get NFT's security and risk data](#get-nfts-security-and-risk-data)
- [dApp Security Info API](#dapp-security-info-api)
- [Check risk of dApp through URL](#check-risk-of-dapp-through-url)
- [Phishing Site Detection API](#phishing-site-detection-api)
- [Check if the URL is a phishing site](#check-if-the-url-is-a-phishing-site)
- [Rug-Pull Detection API (Beta)](#rug-pull-detection-api-beta)
- [Rug-pull risk assessment](#rug-pull-risk-assessment)
- [Token Security API for Solana (Beta)](#token-security-api-for-solana-beta)
- [Get token's security and risk data (Solana)](#get-tokens-security-and-risk-data-solana)
- [Access Token API](#access-token-api)
- [get token (Access Token)](#get-token-obtain-access-token)
- [Transaction Simulation for Solana](#transaction-simulation-for-solana)
- [Check for potential risks in the transaction](#X78337c4fc20ed8fda06c45564d0d6fb26e224c8)
- [Transaction Simulation API (EVM)](#transaction-simulation-api)
- [Transaction Simulation (EVM)](#transaction-simulation-evm)
- [API Status Code](#api-status-code)
- [API License Agreement](#api-license-agreement)
- [Support](#support)

# Introduction

Welcome to the GoPlus Security documentation.

**What is GoPlus Security?**

Web3 users today face growing threats such as scam, phishing, and theft. [GoPlus Security](https://gopluslabs.io) is here to solve this by building an open, permissionless, and user-driven User Security Network for Web3.

**Features**

**GoPlus Security Intelligence**

GoPlus Security provides a comprehensive set of APIs that deliver real-time, automated security intelligence. Designed for scalability and ease of integration, these APIs empower developers and platforms with reliable security insights to protect their users. Below is an overview of each security intelligence API:

- [Token Security API](#token-security-api) – A decentralized and user-driven service that offers detailed security analysis of tokens, providing real-time risk assessments.
- [Malicious Address API](#malicious-address-api) – Free, timely, and comprehensive malicious address library.
- [NFT Security API](#nft-security-api) – Get comprehensive security assessments of NFTs, helping detect scams or fraudulent activities in NFT transactions.
- [Approval Security API](#approval-security-api-v1) – Analyze the security risks associated with token approvals to prevent unauthorized or risky transactions.
- [dApp Security Info API](#dapp-security-info-api) – Aggregates security information from various dApps, offering quick risk alerts and insights to ensure safe interactions.
- [Signature Data Decode API](#signature-data-decode-api) – Decode and analyze ABI signature data for irregularities or signs of malicious activity.
- [Phishing Site Detection API](#phishing-site-detection-api) – Detect and block phishing sites before users fall victim to malicious attempts.
- [Token Security API for Solana (Beta)](#token-security-api-for-solana-beta) – Analyzes token security specifically for the Solana SPL and SPL-2022 standards, providing early insights into potential risks in Solana tokens.
- [Transaction Simulation API for Solana](#transaction-simulation-for-solana) – Simulates Solana transactions to assess the result and detect any potential risks before they are executed on-chain.
- [Transaction Simulation API for EVM](#transaction-simulation-api) – Simulates EVM transactions to assess the result and detect any potential risks before they are executed on-chain.

**GoPlus SafeToken Protocol**

Building on GoPlus Security’s leadership in token security analysis and risk detection, and its deep understanding of security vulnerabilities in token issuance and liquidity management within the DeFi ecosystem, GoPlus has developed the GoPlus SafeToken Protocol. This innovative protocol is designed to address these issues at the root, providing secure token issuance templates and efficient liquidity management tools for the entire industry. Below is an overview of SafeToken Factory and SafeToken Locker:

- **GoPlus SafeToken Factory** – Offers free and open-source token contract templates for developers, enabling quick and secure token issuance.
- **GoPlus SafeToken Locker** – Provides flexible lock-up periods, reward collection, and broad compatibility with major DEX platforms to protect investor interests and ensure project commitment.

For documentation on using and integrating the GoPlus Security API with your applications and platforms, see the [API Overview](#api-overview).

Ready to protect your Web3 operations and assets? Start by reading the [API Overview](#api-overview) to understand the fundamentals of integrating GoPlus Security into your applications.

For any further queries or support, feel free to reach out to our team at [service@gopluslabs.io](mailto:%5Bemail%C2%A0protected%5D). (Beware of phishing attempts or emails impersonating the team.)

Thank you for choosing GoPlus Security. A **#SaferWeb3** awaits.

# GoPlus Security SDK

For building your own applications and integrating your platforms with GoPlus Security API seamlessly, you can use GoPlus Security SDKs. We currently provide SDKs in the following languages:

| Programming Language | GitHub Repository |
| --- | --- |
| Go  | [GoPlus Security Go SDK](https://github.com/GoPlusSecurity/goplus-sdk-go) |
| Java | [GoPlus Security Java SDK](https://github.com/GoPlusSecurity/goplus-sdk-java) |
| Node.js (JavaScript/TypeScript) | [GoPlus Security Node.js SDK](https://github.com/GoPlusSecurity/goplus-sdk-node) |
| Python | [GoPlus Security Python SDK](https://github.com/GoPlusSecurity/goplus-sdk-python) |
| PHP | [GoPlus Security PHP SDK](https://github.com/GoPlusSecurity/goplus-sdk-php) |

## Installation

**Go**  

go get github.com/GoPlusSecurity/goplus-sdk-go

**Java**  
_JDK >= 1.8 required:_  

&lt;dependency&gt;  
&lt;groupId&gt;io.gopluslabs&lt;/groupId&gt;  
&lt;artifactId&gt;goplus-sdk-java&lt;/artifactId&gt;  
&lt;version&gt;0.1.2&lt;/version&gt;  
&lt;/dependency&gt;

**Node.js**  

npm install @goplus/sdk-node

**Python**  

pip install goplus

**PHP**  

composer require goplus/php-sdk

## Examples

For examples of how to use GoPlus Security SDKs, please check the code examples on the [API Overview](#api-overview) page and select your programming language. For example, if you want to use the Go SDK, go to the API Reference page and select "Go" in the "LANGUAGE" tab to see the installation instructions and code examples.

# API Overview

GoPlus Security provides fast, reliable, and convenient security services by providing free, real-time, dynamic, and automated security-detecting APIs:

- [Token Security API](#token-security-api) – Open, permissionless, user-driven token security detection platform.
- [Malicious Address API](#malicious-address-api) – Free, timely, and comprehensive malicious address library.
- [NFT Security API](#nft-security-api) – NFT authenticity detection platform.
- [Approval Security API](#approval-security-api-v1) – Detect risks of token approvals.
- [Approval Security API (v2)](#approval-security-api-v2) – Detect risks of token and NFT approvals in a user’s wallet.
- [dApp Security Info API](#dapp-security-info-api) – Aggregated dApp security info for quick risk alerts.
- [Signature Data Decode API](#signature-data-decode-api) – Decode ABI data and find abnormalities in time.
- [Phishing Site Detection API](#phishing-site-detection-api) – Detect phishing sites.
- [Transaction Simulation API for Solana](#transaction-simulation-for-solana) – Solana Txn pre-run to detect potential risks.
- [Token Security API for Solana](#token-security-api-for-solana-beta) – Token security detection for Solana.
- [Transaction Simulation API for EVM](#transaction-simulation-api) – EVM Txn pre-run to detect potential risks.

# Supported Blockchains

### Get the list of chains supported by different functions

**GET** <https://api.gopluslabs.io/api/v1/supported_chains>  
Get supported blockchains.

#### Response Details

| Chain ID | Chain Name |
| --- | --- |
| 1   | Ethereum |
| 56  | BSC |
| 42161 | Arbitrum |
| 137 | Polygon |
| 324 | zkSync Era |
| 59144 | Linea Mainnet |
| 8453 | Base |
| 534352 | Scroll |
| 10  | Optimism |
| 43114 | Avalanche |
| 250 | Fantom |
| 25  | Cronos |
| 66  | OKC |
| 128 | HECO |
| 100 | Gnosis |
| 10001 | ETHW |
| tron | Tron |
| 321 | KCC |
| 201022 | FON |
| 5000 | Mantle |
| 204 | opBNB |
| 42766 | ZKFair |
| 81457 | Blast |
| 169 | Manta Pacific |
| 80094 | Berachain |
| 2741 | Abstract |
| 177 | Hashkey Chain |
| 146 | Sonic |
| 1514 | Story |

# Token Security API

### Get token's security and risk data

**GET** <https://api.gopluslabs.io/api/v1/token_security/{chain_id}>  
Get token security information.

#### Response Details – Contract Security

| Security Item | Parameter | Description | Notice |
| --- | --- | --- | --- |
| Open Source | is_open_source | Returns "1" if the contract is open-source, "0" if the contract is closed-source. | Closed-sourced contracts may hide various unknown mechanisms and are extremely risky. When the contract is closed-source, other risk items will return null. |
| Proxy Contract | is_proxy | Returns "1" if the contract is a proxy contract, "0" if the contract is not a proxy contract. | This value will not be returned if the proxy status of the contract is unknown.&lt;br&gt;(1) Will not be returned if "is_open_source" is 0.&lt;br&gt;(2) Most proxy contracts are accompanied by implementation contracts which are modifiable, potentially containing significant risk. When the contract is a proxy, other risk items may not be returned. |
| Mint Function | is_mintable | Returns "1" if the contract has the ability to mint tokens, "0" if the contract does not have the ability to mint tokens. | This value will not be returned if the minting ability of the contract is unknown.&lt;br&gt;(1) Will not be returned if "is_open_source" is 0.&lt;br&gt;(2) May not be returned if "is_proxy" is 1.&lt;br&gt;(3) Mint functions can trigger a massive sell-off, causing the coin price to plummet. It is an extremely risky function for a contract to have.&lt;br&gt;(4) This function generally relies on ownership. When the contract does not have an owner (or if the owner is a black hole address) and the owner cannot be retrieved, this function will most likely be disabled. |
| Owner Address | owner_address | This contract's owner address. No value will be returned if the owner address is unknown. An empty string will be returned if the contract has no owner. | (1) Will not be returned if "is_open_source" is 0.&lt;br&gt;(2) May not be returned if "is_proxy" is 1.&lt;br&gt;(3) Ownership is usually used to adjust the parameters and status of the contract, such as minting, modification of slippage, suspension of trading, setting blacklist, etc. When the contract's owner cannot be retrieved, is a black hole address, or does not have an owner, ownership-related functionality will most likely be disabled. |
| Take Back Ownership | can_take_back_ownership | Returns "1" if ownership can be reclaimed; "0" if it cannot. (No return if data is unknown.) | (1) Will not be returned if "is_open_source" is 0.&lt;br&gt;(2) May not be returned if "is_proxy" is 1.&lt;br&gt;(3) Ownership is usually used to adjust the parameters and status of the contract, such as minting, modification of slippage, suspension of trading, setting blacklist, etc. When the contract's owner cannot be retrieved, is a black hole address, or does not have an owner, ownership-related functionality will most likely be disabled. These risky functions may be able to be reactivated if ownership is reclaimed. |
| Owner Can Change Balance | owner_change_balance | Returns "1" if the contract owner can change token holder balances; "0" if it cannot. (No return if data is unknown.) | (1) Will not be returned if "is_open_source" is 0.&lt;br&gt;(2) May not be returned if "is_proxy" is 1.&lt;br&gt;(3) Tokens with this feature allow the owner to modify anyone's balance, resulting in a holder's asset being changed (for example, set to 0) or a massive minting and sell-off.&lt;br&gt;(4) This function generally relies on ownership. When the contract's owner cannot be retrieved, is a black hole address, or does not have an owner, ownership-related functionality will most likely be disabled. |
| With Hidden Owner | hidden_owner | Returns "1" if the contract has hidden owners; "0" if it does not. | Will not be returned if hidden ownership status is unknown.&lt;br&gt;(1) Will not be returned if "is_open_source" is 0.&lt;br&gt;(2) May not be returned if "is_proxy" is 1.&lt;br&gt;(3) Hidden ownership is used by developers to maintain ownership ability even after abandoning ownership, and is often an indicator of malicious intent. When a hidden owner exists, it is safe to assume that ownership has not been abandoned. |
| Self-Destruct | selfdestruct | Returns "1" if the contract can self-destruct; "0" if it cannot. | Will not be returned if self-destruct data is unknown.&lt;br&gt;(1) Will not be returned if "is_open_source" is 0.&lt;br&gt;(2) When the self-destruct function is triggered, the contract will be destroyed, all of its functions will be unavailable, and all related assets will be erased. |
| With External Call | external_call | Returns "1" if the contract can call functions in other contracts during the execution of primary methods; "0" if it does not. | Will not be returned if external call capability is unknown.&lt;br&gt;(1) Will not be returned if "is_open_source" is 0.&lt;br&gt;(2) External calls cause the implementation of this contract to be dependent on other external contracts which may or may not be risky. |
| Gas Abuse | gas_abuse | Returns "1" if the contract is using user's gas fee to mint other assets. (No return means no evidence of gas abuse.) | Any interaction with such addresses may result in loss of property. |

#### Response Details – Trading Security

| Security Item | Parameter | Description | Notice |
| --- | --- | --- | --- |
| Is in DEX | is_in_dex | Returns "1" if the token can be traded in a decentralized exchange; "0" if not. | Only returns "1" if the token has a liquidity pair with mainstream coins/tokens. |
| Buy Tax | buy_tax | Returns the buy tax of the token on a scale from 0 to 1. An empty string ("") means the tax is unknown. | (1) Not returned if is_in_dex = 0.&lt;br&gt;(2) When buying a token, a buy tax will cause the actual token value received to be less than the amount paid. An excessive buy tax may lead to heavy losses.&lt;br&gt;(3) A buy_tax of "1" (100% buy tax) means all purchase funds go towards the tax (the token effectively cannot be purchased).&lt;br&gt;(4) A token's anti-bot mechanism may set cannot_buy = 1, which will cause buy_tax to also return "1".&lt;br&gt;(5) Some tokens are designed not to be sold, indicated by cannot_buy = 1, which will cause buy_tax to also return "1". |
| Sell Tax | sell_tax | The tax when selling the token. An empty string ("") means unknown. | (1) Not returned if is_in_dex = 0.&lt;br&gt;(2) Sell tax causes the actual value received when selling to be less than expected, and too high a sell tax may lead to large losses.&lt;br&gt;(3) sell_tax = "1" means sell tax is 100% or the token cannot be sold.&lt;br&gt;(4) Sometimes a token's trading cool-down mechanism (trading_cooldown = 1) can cause sell_tax to return "1". |
| Transfer Tax | transfer_tax | The tax when transferring the token between non-DEX addresses. An empty string or no return means unknown. | (1) Not returned if is_in_dex = 0.&lt;br&gt;(2) Transfer tax causes the actual value received when transferring to be less than expected; too high a transfer tax may lead to large losses.&lt;br&gt;(3) transfer_tax = "1" means transfer tax is 100% or the token cannot be transferred.&lt;br&gt;(4) Sometimes a token's trading cool-down mechanism (trading_cooldown = 1) can cause transfer_tax to return "1". |
| Cannot be bought | cannot_buy | Describes whether the token can be bought. "1" means it cannot be bought; "0" means it can be; no return means unknown. | (1) Generally, cannot_buy = "1" is found in reward tokens (issued as rewards and cannot be bought directly by users).&lt;br&gt;(2) Sometimes a token's anti-bot mechanism can block our sandbox system, causing buy_tax to show "1".&lt;br&gt;(3) When cannot_buy = "1", our sandbox system might be blocked, causing buy_tax = "1" and sell_tax = "1\`. |
| Cannot Sell All | cannot_sell_all | Describes whether the contract has a function restricting token holders from selling all their tokens. "1" means true; "0" means false; no return means unknown. | (1) Not returned if is_in_dex = 0.&lt;br&gt;(2) This feature means that you will not be able to sell all your tokens in a single sale; you may need to leave a certain percentage (e.g. 10%) or a fixed number of tokens (e.g. 10 tokens).&lt;br&gt;(3) When buy_tax = "1", this field will not be returned. |
| Modifiable Tax | slippage_modifiable | Describes whether the trading tax can be modified by the token contract. "1" means true; "0" means false; no return means unknown. | (1) Not returned if is_open_source = 0.&lt;br&gt;(2) Sometimes, if is_proxy = 1, there will be no return.&lt;br&gt;(3) If the tax is modifiable, the contract owner can modify the buy or sell tax. This may cause losses, especially since some contracts have unlimited modifiable tax rates which can make the token untradeable.&lt;br&gt;(4) This function generally relies on ownership. If the contract has no owner (or the owner is a black hole address) and the owner cannot be retrieved, this function will likely be disabled. |
| Honeypot | is_honeypot | Describes whether the token is a honeypot. "Honeypot" means the token may not be sellable due to the contract's functions or malicious code. "1" means true; "0" means false; no return means unknown. | (1) Not returned if is_open_source = 0.&lt;br&gt;(2) Sometimes, if is_proxy = 1, there will be no return.&lt;br&gt;(3) **High risk, definitely a scam token.** |
| Pausable Transfer | transfer_pausable | Describes whether trading can be paused by the token contract. "1" means true; "0" means false; no return means unknown. | (1) Not returned if is_open_source = 0.&lt;br&gt;(2) Sometimes, if is_proxy = 1, there will be no return.&lt;br&gt;(3) This feature means the contract owner can suspend trading at any time, after which no one will be able to sell (except those with special authority).&lt;br&gt;(4) This function generally relies on ownership. If the contract has no owner (or the owner is a black hole address) and the owner cannot be retrieved, this function will likely be disabled. |
| Blacklist | is_blacklisted | Describes whether a blacklist function is included in the contract. If there is a blacklist, some addresses may not be able to trade normally. "1" means true; "0" means false; no return means unknown. | (1) Not returned if is_open_source = 0.&lt;br&gt;(2) Sometimes, if is_proxy = 1, there will be no return.&lt;br&gt;(3) The contract owner may add any address to the blacklist, and addresses on the blacklist will not be able to trade. Abuse of the blacklist function will lead to great risks.&lt;br&gt;(4) If the contract has no owner (or the owner is a black hole address), the blacklist cannot be updated. However, any existing blacklist entries remain in effect. |
| Whitelist | is_whitelisted | Describes whether a whitelist function is included in the contract. If there is a whitelist, some addresses may be allowed special trading conditions. "1" means true; "0" means false; no return means unknown. | (1) Not returned if is_open_source = 0.&lt;br&gt;(2) Sometimes, if is_proxy = 1, there will be no return.&lt;br&gt;(3) Whitelisting is mostly used to allow specific addresses to make early transactions (often tax-free and not subject to pauses).&lt;br&gt;(4) If the contract has no owner (or the owner is a black hole address), the whitelist cannot be updated. However, existing whitelist entries remain in effect. |
| Dex info | dex | Describes DEX information where the token can be traded. | (1) If is_in_dex = 0, an empty array is returned.&lt;br&gt;(2) Only accounts liquidity pools where the token pairs with mainstream tokens.&lt;br&gt;(3) Liquidity values are denominated in USDT.&lt;br&gt;_(Fields in each entry: liquidity_type (e.g., UniV2, UniV3, UniV4), name (pool contract name), liquidity (total USD liquidity), pair (liquidity pool address), pool_manager (for UniV4 pools).)_ |
| Anti Whale | is_anti_whale | Describes whether the contract limits the maximum transaction amount or the maximum token position for a single address. "1" means true; "0" means false; no return means unknown. | (1) Not returned if is_open_source = 0.&lt;br&gt;(2) Sometimes, if is_proxy = 1, there will be no return. |
| Modifiable anti whale | anti_whale_modifiable | Describes whether the contract can modify the anti-whale limits (max transaction or position). "1" means true; "0" means false; no return means unknown. | (1) Not returned if is_open_source = 0.&lt;br&gt;(2) Sometimes, if is_proxy = 1, there will be no return.&lt;br&gt;(3) If the anti-whale value is set to a very small value, all trading would fail. |
| Trading with CooldownTime | trading_cooldown | Describes whether the contract has a trading cool-down mechanism that limits the minimum time between two transactions. "1" means true; "0" means false; no return means unknown. | (1) Not returned if is_open_source = 0.&lt;br&gt;(2) Sometimes, if is_proxy = 1, there will be no return. |
| Assigned Address' Slippage is Modifiable | personal_slippage_modifiable | Describes whether the owner can set a different tax rate for each assigned address. "1" means true; "0" means false; no return means unknown. | (1) Not returned if is_open_source = 0.&lt;br&gt;(2) Sometimes, if is_proxy = 1, there will be no return.&lt;br&gt;(3) The contract owner may set an outrageous tax rate for a specific address to block it from trading. Abuse of this function leads to great risks.&lt;br&gt;(4) If the contract has no owner (or the owner is a black hole address), this function cannot be used. However, any existing assigned tax rates remain in effect. |

#### Response Details – Info Security

| Security Item | Parameter | Description | Notice |
| --- | --- | --- | --- |
| Token Name | token_name | Name of the token. | _(No additional details)_ |
| Token Symbol | token_symbol | Symbol of the token. | _(No additional details)_ |
| Token holder number | holder_count | It describes the number of token holders. Example: "holder_count": "4342". | _(No additional details)_ |
| Token Total Supply | total_supply | It describes the total supply of the token. Example: "total_supply": 100000000. | _(No additional details)_ |
| Top10 holders info | holders | Top 10 token holders' info. Includes: (1) address (holder's address); (2) is_locked (1 if tokens are locked, 0 if not); (3) tag (public tag of address, e.g., Burn Address or Deployer); (4) is_contract (1 if holder is a contract, 0 if not); (5) balance (tokens held); (6) percent (percentage of tokens held); (7) locked_detail (array with lock info if is_locked = 1, with each entry having amount locked, end_time unlock time, opt_time lock time). | (1) We only include known token lock addresses or black hole addresses in locked_detail.&lt;br&gt;(2) If is_locked = 0 or the lock address is a black hole address, locked_detail will not be returned.&lt;br&gt;(3) Note: a percent value of 1 corresponds to 100%. |
| Owner Balance | owner_balance | The balance of the contract owner. Example: "owner_balance": 100000000. | No return or empty return means there is no ownership or it can't be determined. If owner_address is empty or not returned, owner_balance will not be returned. |
| Token Percentage of Owner | owner_percent | The percentage of tokens held by the contract owner. Example: "owner_percent": "0.1" (which means 10%). | (1) No return or empty return means there is no ownership or it can't be determined.&lt;br&gt;(2) Note: a value of 1 corresponds to 100%.&lt;br&gt;(3) If owner_address is empty or not returned, this field will not be returned. |
| Creator Address | creator_address | It describes the contract's creator address. | _(No additional details)_ |
| Creator Balance | creator_balance | It describes the balance of the contract creator. Example: "creator_balance": 100000000. | _(No additional details)_ |
| Token Percentage of Creator | creator_percent | It describes the percentage of tokens held by the contract creator. Example: "creator_percent": 0.1 (10%). | 1 corresponds to 100%. |
| LP token holder number | lp_holder_count | It describes the number of LP token holders. Example: "lp_holder_count": "4342". | No return means no LP.&lt;br&gt;(1) If is_in_dex = 0, this field will not be returned. |
| LP Token Total Supply | lp_total_supply | It describes the total supply of the LP token. Example: "lp_total_supply": "100000000". | No return means no LP.&lt;br&gt;(1) If is_in_dex = 0, this field will not be returned.&lt;br&gt;(2) Note: this is the number of LP tokens (liquidity pool tokens), **not** the token's supply. |
| Top10 LP token holders info | lp_holders | Top 10 LP token holders' info. Includes: (1) address; (2) is_locked (1 or 0); (3) tag; (4) is_contract (1 or 0); (5) balance; (6) percent; (7) For UniV3 pools: an NFT_list with details of the liquidity position (e.g., value, NFT_id, amount, in_effect, NFT_percentage); (8) locked_detail (array with lock info if is_locked = 1; similar structure as holders above). | (1) If is_in_dex = 0, no data (empty array) will be returned.&lt;br&gt;(2) We only include known token lock addresses or black hole addresses for locked_detail info.&lt;br&gt;(3) Note: a percent of 1 corresponds to 100%.&lt;br&gt;(4) If is_locked = 0, or the lock address is a black hole address, locked_detail will not be returned.&lt;br&gt;(5) For UniV3 liquidity pools, NFT_list fields (value, NFT_id, amount, in_effect, NFT_percentage) detail the position information. |
| Airdrop Scam | is_airdrop_scam | It describes whether the token is an airdrop scam. "1" means true; "0" means false; **None** means no conclusive information. | Only "is_airdrop_scam": "1" definitively indicates an airdrop scam. |
| Trust List | trust_list | It describes whether the token is a famous and trustworthy one. "1" means true; no return means no conclusive result. | (1) Only "trust_list": "1" means it is a famous and trustworthy token.&lt;br&gt;(2) No return doesn't mean it is risky; it may just not be on the trust list. |
| Other Potential Risks | other_potential_risks | It describes whether the contract has other potential risks. Example: "other_potential_risks": "Owner can set different transaction taxes for each user, which can trigger serious losses." | (1) If we haven't found any other potential risk, this field will not be returned.&lt;br&gt;(2) Type: string. |
| Note | note | It describes other things investors need to know about the contract. Example: "note": "Contract owner is a multisign contract." | (1) If we haven't found any additional noteworthy information, this field will not be returned.&lt;br&gt;(2) Type: string. |
| Fake Token | fake_token | Indicates whether the token is a counterfeit of a mainstream asset. If it is, "value": 1 and "true_token_address" provides the authentic asset's address(es). | Example: "fake_token": { "true_token_address": "0xff970a61...bbdB5CC8, 0xaf88d065...268E5831", "value": 1 }. If no evidence indicates a counterfeit asset, this field will not be returned. |
| In Major CEX | is_in_cex | Indicates whether this token has been listed on major centralized exchanges (widely trusted, relatively low risk). Returned as an object, e.g. "is_in_cex": { "listed": "1", "cex_list": \[ "Binance" \] }. | (1) If the token is not found on known CEXs, this field will not be returned (this does **not** necessarily mean the token is risky).&lt;br&gt;(2) When 'listed' is "1", other risk alerts can generally be ignored, and the token can be considered safe. |
| Launchpad Token | launchpad_token | Indicates whether the token was deployed through a well-known and trustworthy launchpad. Provided as an object, e.g. "launchpad_token": { "is_launchpad_token": "1", "launchpad_name": "four.meme" }. | (1) If the token is not found in our supported launchpad list, this field will not be returned (this does not necessarily mean it is risky). |

# Malicious Address API

### Check if the address is malicious

**GET** <https://api.gopluslabs.io/api/v1/address_security/{address}>  
Get address security information.

#### Response Details

| Security Item | Parameter | Description | Notice |
| --- | --- | --- | --- |
| Data Source | data_source | The data source for this address information. | For example: GoPlus, SlowMist. |
| Addresses Related to Honeypot | honeypot_related_address | Whether this address is related to honeypot tokens or has created scam tokens. "1" means true; "0" means false. | Addresses related to honeypots include creators or owners of honeypot tokens. This address is considered dangerous if it is related to honeypot tokens. |
| Phishing Activities | phishing_activities | Whether this address has implemented phishing activities. "1" means true; "0" means false. | _(No additional details)_ |
| Black Mail Activities | blackmail_activities | Whether this address has implemented blackmail activities. "1" means true; "0" means false. | _(No additional details)_ |
| Stealing Attack | stealing_attack | Whether this address has implemented stealing attacks. "1" means true; "0" means false. | _(No additional details)_ |
| Fake KYC | fake_kyc | Whether this address is involved in fake KYC. "1" means true; "0" means false. | _(No additional details)_ |
| Malicious Mining Activities | malicious_mining_activities | Whether this address is involved in malicious mining activities. "1" means true; "0" means false. | _(No additional details)_ |
| Darkweb Transactions | darkweb_transactions | Whether this address is involved in dark web transactions. "1" means true; "0" means false. | _(No additional details)_ |
| Cybercrime | cybercrime | Whether this address is involved in cybercrime. "1" means true; "0" means false. | _(No additional details)_ |
| Money Laundering | money_laundering | Whether this address is involved in money laundering. "1" means true; "0" means false. | _(No additional details)_ |
| Financial Crime | financial_crime | Whether this address is involved in financial crime. "1" means true; "0" means false. | _(No additional details)_ |
| Suspected Malicious Address | blacklist_doubt | Whether this address is suspected of malicious behavior. "1" means true; "0" means false. | _(No additional details)_ |
| Contract Address | contract_address | Whether this address is a contract address. "1" means true; "0" means false. | If only the address is provided without a chain ID, this field will not be returned (because the same address could be a contract on one chain but not on another). This determination uses a third-party blockchain explorer; the field may be empty on the first request (try again after ~5 seconds). |
| Coin Mixer Address | mixer | Whether this address is a coin mixer address. "1" means true; "0" means false. | Interacting with coin mixer addresses may result in your address being added to third-party risk lists. |
| Sanctioned Address | sanctioned | Whether this address is a sanctioned address. "1" means true; "0" means false. | _(No additional details)_ |
| Number of Malicious Contracts Created | number_of_malicious_contracts_created | How many malicious contracts have been created by this address. | _(No additional details)_ |
| Gas Abuse | gas_abuse | Whether this address is cheating other users' gas fees to mint other assets. | Any interaction with such addresses may result in loss of property. |
| Reinited | reinit | Whether this address/contract has been deployed more than once, and can be deployed again. | If a contract can be reinitialized, the developer can change the contract code at will. |
| Fake Standard Interface | fake_standard_interface | Whether this contract contains standard interfaces that do not conform to standard protocol requirements. | Fake standard interfaces are mostly seen in scam assets. |
| Fake Token | fake_token | Whether the token (contract) is a counterfeit of a mainstream asset. | _(No additional details)_ |

# Approval Security API (v1)

### Check if the approval is secure

**GET** <https://api.gopluslabs.io/api/v1/approval_security/{address}>  
Check if the token approval is secure.

#### Response Details

| Security Item | Parameter | Description | Notice |
| --- | --- | --- | --- |
| Contract Name | contract_name | The approved contract's name. | _(No additional details)_ |
| Contract Tag | tag | Which dApp uses the contract (if known). | Example: "tag": "Compound". |
| Contract or not | is_contract | Whether the address is a contract. "1" means true; "0" means false. | _(No additional details)_ |
| Creator Address | creator_address | The creator address of the contract. | Will return "null" if the address is not a contract (is_contract = 0). |
| Deployed Time | deployed_time | The deployed time of the contract (timestamp). | Will return "null" if is_contract = 0. |
| Open Source | is_open_source | Whether this contract is open source. "1" means true; "0" means false. | Will return "null" if is_contract = 0 (i.e., if the address is not a contract). |
| Trust List | trust_list | Whether the address is a famous and trustworthy one. "1" means true; "0" means not in our trusted list. | A "0" does not necessarily mean the address is untrustworthy – it may simply not be included yet. |
| Suspected Malicious Contract | doubt_list | Whether the address is a suspected malicious contract. "1" means true; "0" means no malicious behavior found. | A "0" does not necessarily mean it is safe – it may just mean we haven't found malicious behavior. |
| Specific Malicious Behavior | malicious_behavior:\[\] | Specific malicious behaviors identified for this address (array). | Possible values include: "honeypot_related_address", "phishing_activities", "blackmail_activities", "stealing_attack", "fake_kyc", "malicious_mining_activities", "darkweb_transactions", "cybercrime", "money_laundering", "financial_crime", "blacklist_doubt", "mixer", "sanctioned", "gas_abuse", "reinit", "fake_standard_interface". An empty array means no malicious behavior was found. |
| Contract San Result | contract_scan | Risk detection results for the spender contract. | (1) **owner**: includes owner_name (ownership function name; "unknown" if none detected), owner_address (owner address; empty if unknown), owner_type ("blackhole", "contract", "eoa", "multi-address", or null if not detected).&lt;br&gt;(2) **privilege_withdraw**: "1" if the contract owner can withdraw all assets without users' permission; "0" if not; "-1" if unknown.&lt;br&gt;(3) **withdraw_missing**: "1" if the contract lacks a withdrawal method (users can't withdraw assets); "0" if not; "-1" if unknown.&lt;br&gt;(4) **blacklist**: "1" if the contract has a blacklist function that could block user withdrawals; "0" if not; "-1" if unknown.&lt;br&gt;(5) **selfdestruct**: "1" if this contract can self-destruct; "0" if not; "-1" if unknown.&lt;br&gt;(6) **approval_abuse**: "1" if the owner can spend allowances obtained by the contract (potentially stealing user assets); "0" if not; "-1" if unknown.&lt;br&gt;_Note:_ If is_proxy = 1 or is_open_source = 0, all contract_scan sub-fields will return -1 (unknown). If is_contract = 0 (the address is not a contract), contract_scan will be empty (not returned). |
| Risky Approval | risky_approval | Indicates whether there is explicit risk associated with this Approval. | Provided as an object with "value" (1 = explicit risk, 0 = no explicit risk evidence) and "risk" describing the risk if any. _(No additional details)_ |

# Approval Security API (v2)

### Returns the ERC-20 approvals of an EOA address and associated risk items

**GET** <https://api.gopluslabs.io/api/v2/token_approval_security/{chain_id}>  
Get an address's ERC-20 token approvals and associated risk analysis.

| Security Item | Parameter | Description | Notice |
| --- | --- | --- | --- |
| Token Contract | token_address | The token contract address which is approved. | _(No additional details)_ |
| Chain | chain_id | Blockchain chain ID. e.g., "1" for Ethereum, "56" for BSC. | _(No additional details)_ |
| Token Name | token_name | Name of the token. | _(No additional details)_ |
| Token Symbol | token_symbol | Symbol of the token. | _(No additional details)_ |
| Token Precision | decimals | Token precision (number of decimals). | _(No additional details)_ |
| Token Holdings | balance | The token balance of the owner address. | _Return type is string._ |
| Open Source | is_open_source | Whether the token contract is open source. "1" means true; "0" means false. | _(No additional details)_ |
| Malicious Token | malicious_address | Whether this token has performed malicious behaviors. "1" means true; "0" means false. | Malicious behaviors include scams such as honeypots, blacklist abuse, falsified transactions, etc. Interacting with malicious tokens is high-risk. |
| Specific Malicious Behavior | malicious_behavior:\[\] | Specific malicious behaviors by this token contract (array of strings). | See **Malicious Address API** for possible values. An empty array means none found. |
| Approved Contract | approved_contract | The contract (spender) that has been approved. | _(No additional details)_ |
| Initial Approval Time | initial_approval_time | Timestamp of the first time the owner approved allowance to this spender. | _(No additional details)_ |
| Initial Approval Hash | initial_approval_hash | Transaction hash of the initial approval. | _(No additional details)_ |
| Latest Approved Time | approved_time | Timestamp of the latest allowance changing transaction. | _(No additional details)_ |
| Latest Approved Hash | hash | Transaction hash of the latest allowance change. | _(No additional details)_ |
| Approved Amount | approved_amount | The current approved amount (allowance). | _Return type is string._ |

### Returns the ERC-721 approvals of an EOA address and associated risk items

**GET** <https://api.gopluslabs.io/api/v2/nft721_approval_security/{chain_id}>  
Get an address's ERC-721 (NFT) approvals and associated risk analysis.

| Security Item | Parameter | Description | Notice |
| --- | --- | --- | --- |
| NFT Contract | nft_address | The NFT contract address which is approved. | _(No additional details)_ |
| Chain | chain_id | Blockchain chain ID. e.g., "1" for Ethereum; "56" for BSC. | _(No additional details)_ |
| NFT Name | nft_name | Name of the NFT collection. | _(No additional details)_ |
| NFT Symbol | nft_symbol | NFT collection symbol. | _(No additional details)_ |
| Open Source | is_open_source | Whether this contract is open source. "1" means true; "0" means false. | _(No additional details)_ |
| The NFT verified | is_verified | Whether the NFT is verified. "1" means verified; "0" means no verification info found. | _(No additional details)_ |
| Malicious NFT | malicious_address | Whether this token (NFT contract) has performed malicious behaviors. "1" means true; "0" means false. | Malicious behaviors include random additions, blacklist abuse, falsified transactions, etc. Interacting with malicious NFTs is high-risk. |
| Specific Malicious Behavior | malicious_behavior:\[\] | Specific malicious behaviors by this NFT contract (array). | See **Malicious Address API** for possible values. An empty array means none found. |
| Approved Contract | approved_contract | The contract (operator) that has been approved. | _(No additional details)_ |
| Initial Approval Time | initial_approval_time | Timestamp of the first approval given by the owner. | _(No additional details)_ |
| Initial Approval Hash | initial_approval_hash | Transaction hash of the initial approval. | _(No additional details)_ |
| Latest Approved Time | approved_time | Timestamp of the latest allowance change (approval or revocation). | _(No additional details)_ |
| Latest Approved Hash | hash | Transaction hash of the latest allowance change. | _(No additional details)_ |
| Approved Type (Approved for all / single NFT) | approved_for_all | Type of approval. "1" means approved for all NFTs; "0" means approved for a single NFT. | (Only ERC-721 has both types. ERC-1155 only has "approved for all".) |
| Token_id of Approved NFT | approved_token_id | The token ID of the approved NFT (if the approval is for a single token). | If approved_for_all = 1, this returns "null". |

### Returns the ERC-1155 approvals of an EOA address and associated risk items

**GET** <https://api.gopluslabs.io/api/v2/nft1155_approval_security/{chain_id}>  
Get an address's ERC-1155 (multi-token) approvals and associated risk analysis.

| Security Item | Parameter | Description | Notice |
| --- | --- | --- | --- |
| NFT Contract | nft_address | The NFT contract address which is approved. | _(No additional details)_ |
| Chain | chain_id | Blockchain chain ID. e.g., "1" for Ethereum; "56" for BSC. | _(No additional details)_ |
| NFT Name | nft_name | Name of the NFT collection. | _(No additional details)_ |
| NFT Symbol | nft_symbol | NFT collection symbol. | _(No additional details)_ |
| Open Source | is_open_source | Whether this contract is open source. "1" means true; "0" means false. | _(No additional details)_ |
| The NFT verified | is_verified | Whether the NFT is verified. "1" means verified; "0" means not verified or unknown. | _(No additional details)_ |
| Malicious NFT | malicious_address | Whether this NFT contract has performed malicious behaviors. "1" means true; "0" means false. | _(See above for malicious behaviors.)_ |
| Specific Malicious Behavior | malicious_behavior:\[\] | Specific malicious behaviors by this NFT contract (array). | _(No additional details; empty array if none.)_ |
| Approved Contract | approved_contract | The contract (operator) that has been approved. | _(No additional details)_ |
| Initial Approval Time | initial_approval_time | Timestamp of the first approval given by the owner. | _(No additional details)_ |
| Initial Approval Hash | initial_approval_hash | Transaction hash of the initial approval. | _(No additional details)_ |
| Latest Approved Time | approved_time | Timestamp of the latest approval change. | _(No additional details)_ |
| Latest Approved Hash | hash | Transaction hash of the latest approval change. | _(No additional details)_ |

#### Response Details – Address Info

For each approved contract returned above, an **address_info** object is also included, containing fields such as contract_name, tag, is_contract, is_open_source, trust_list, doubt_list, malicious_behavior:\[\], creator_address, and deployed_time (see the **Approval Security API (v1)** response details for descriptions of these fields).

# Signature Data Decode API

### Get ABI decode info

**POST** <https://api.gopluslabs.io/api/v1/abi_decode>  
Decode and analyze ABI signature data for irregularities or signs of malicious activity.

#### Response Details

| Security Item | Parameter | Description | Notice |
| --- | --- | --- | --- |
| Method Name | method | The method name in the ABI (e.g., "transfer"). | _(No additional details)_ |
| Parameter Type | type | The parameter type in the ABI (e.g., "address", "uint256", "bool"). | _(No additional details)_ |
| Parameter Name | name | The parameter name in the ABI (e.g., "\_from", "\_to", "\_value"). | _(No additional details)_ |
| Input Data | input | The input data of the transaction in ABI-decoded form. | _(No additional details)_ |
| Address Info | address_info | Info about the address if a parameter is of type address. | (1) **is_contract**: "1" if the address is a contract; "0" if not.&lt;br&gt;(2) **contract_name**: contract name (if applicable).&lt;br&gt;(3) **standard**: standard type of the contract (example: "erc20").&lt;br&gt;(4) **symbol**: token symbol (if the address is an ERC20 contract).&lt;br&gt;(5) **name**: token name (if the address is an ERC20 contract).&lt;br&gt;(6) **malicious_address**: "1" if the address is a suspected malicious contract; "0" otherwise.&lt;br&gt;_Note:_ If the address is not a contract (is_contract = 0), then contract_name, standard, symbol, and name will be null. If the address is a contract but not an ERC20 token, then standard, symbol, and name will be null. |
| Contract Name | contract_name | The name of the contract that the user is interacting with (if identifiable). | _(No additional details)_ |
| Contract Description | contract_description | Description of the contract (if available). | _(No additional details)_ |
| Is Malicious Contract | malicious_contract | Indicates if the contract being interacted with is identified as malicious. "1" means yes; "0" means no. | _(No additional details)_ |
| Signature Detail | signature_detail | Explanation of the function of the method. | _(No additional details)_ |
| Is Risky Signature | risky_signature | Indicates if the transaction that users are signing contains risk. "1" means the signature is considered risky; "0" means no explicit risk detected. | Even commonly used, well-known contracts can be risky if not used properly. |
| Risk Detail | risk | Detailed explanation of why the transaction signature is risky (if risky_signature = 1). | _(No additional details)_ |

# NFT Security API

### Get NFT's security and risk data

**GET** <https://api.gopluslabs.io/api/v1/nft_security/{chain_id}>  
Get security assessment of an NFT.

#### Response Details

- **NFT Name (nft_name):** _Returns the name of the NFT collection._
- **NFT Symbol (nft_symbol):** _Returns the symbol of the NFT collection._
- **NFT Description (nft_description):** Introduction of the NFT collection. Return "null" if no description is available.
- **NFT ERC (nft_erc):** The ERC protocol of the NFT (e.g., "erc721").
- **Creator Address (creator_address):** The creator's address of the NFT. Return "null" if not found.
- **Create Block Number (create_block_number):** The number of blocks at the time the NFT was created. Return "null" if not found.
- **Website URL (website_url):** The official website URL of the NFT project. Return "null" if none is available or found.
- **Discord URL (discord_url):** The Discord invite/URL associated with the NFT. Return "null" if none or not found.
- **GitHub URL (github_url):** The GitHub URL of the NFT project. Return "null" if none or not found.
- **Twitter URL (twitter_url):** The Twitter URL of the NFT project. Return "null" if none or not found.
- **Medium URL (medium_url):** The Medium blog URL of the NFT project. Return "null" if none or not found.
- **Telegram URL (telegram_url):** The Telegram channel URL of the NFT project. Return "null" if none or not found.
- **NFT Items (nft_items):** The total number of NFT items in this collection.
- **NFT Holders (nft_owner_number):** The number of holders of NFTs in the collection.
- **Average Price 24h (average_price_24h):** The average price of the NFTs in this collection over the past 24 hours.
- **Lowest Price 24h (lowest_price_24h):** The lowest sale price of an NFT in this collection over the past 24 hours.
- **Sales 24h (sales_24h):** The number of NFT sales in this collection over the past 24 hours.
- **Traded Volume 24h (traded_volume_24h):** The total trading volume of NFTs in this collection over the past 24 hours.
- **Total Volume (total_volume):** The all-time total trading volume of NFTs in this collection.
- **Highest Price (highest_price):** The highest sale price of an NFT in this collection (all-time).
- **NFT Verified (nft_verified):** Whether the NFT collection is verified (e.g., on marketplaces). "1" means verified; "0" means no verification info found.
- **Duplicate Name NFTs (same_nfts):** Information on other NFT collections with duplicate names and symbols. For each such collection, includes: nft_name, nft_symbol, nft_address, nft_owner_number (holders count), and create_block_number. Return "null" if none exist.
- **Trust List (trust_list):** Whether the NFT is famous and trustworthy. "1" means yes; **null** means no conclusive result. _(Only "1" definitively indicates a well-known, trustworthy NFT. "null" does not necessarily imply risk.)_
- **Malicious NFT (malicious_nft_contract):** Whether the NFT has performed malicious behaviors. "1" means true; "0" means false. _(Malicious behaviors include random additions, blacklist abuse, falsified transactions, etc. NFTs flagged as malicious are high-risk.)_
- **Open Source (nft_open_source):** Whether the NFT contract is open source. "1" means true; "0" means false. _(If not open source, we cannot detect other risk items.)_
- **NFT Contract is Proxy (nft_proxy):** Whether the NFT contract has a proxy. "1" means true; "0" means false; "null" means unknown. _(If nft_open_source = 0, this returns "null". Most proxy contracts have modifiable implementation contracts, which is a significant risk.)_
- **Metadata Frozen (metadata_frozen):** Whether the NFT metadata is stored via a decentralized method (IPFS, Arweave, on-chain, etc.). "1" means metadata is effectively frozen; "0" means not; "null" means unknown. _(If nft_open_source = 0, returns "null".)_
- **Privileged Burn (privileged_burn):** Whether the NFT contract owner can burn others' NFTs. **Risk status values:**
- **null:** Contract not open source or is a proxy, so risk cannot be determined.
- **\-1:** Risk detected but ownership is renounced (or a vulnerability is present but considered not exploitable under current conditions).
- **0:** No risk detected (owner cannot burn others' NFTs).
- **1:** Risk detected (owner _can_ burn others' NFTs) and owner's address is a common address (EOA), indicating clear risk.
- **2:** Risk detected, but the owner's address is a contract (risk is present but mitigated to some extent).
- **3:** Risk detected, but the owner's address is not detectable or is an array (multiple owners).  
    _(If this risk exists, it means the owner can directly burn others' NFTs.)_
- **owner_address:** The owner's address (or null if not retrievable).
- **owner_type:** Type of owner ("blackhole" if a burn address; "contract"; "eoa"; "multi-address"; or null if not detected).
- **Transfer Without Approval (transfer_without_approval):** Whether the NFT owner can transfer NFTs without approval (also known as "sleep minting"). _(Uses the same risk value scheme as privileged_burn above.)_ **Sleep minting** example: a scammer first sends the NFT to a famous wallet address, then later retrieves it. After the NFT's value appreciates (by association with the famous address), the scammer sells it.
- **Privileged Minting (privileged_minting):** Whether the NFT contract has minting methods that can only be triggered by an address with special privileges. _(Uses the same risk scheme as above.)_ Some minting methods can only be called by the owner or a privileged address, allowing potential abuse.
- **Self-Destruct (self_destruct):** Whether the NFT contract can self-destruct. _(Uses the same risk scheme as above.)_ If triggered, the contract is destroyed, all functions become unavailable, and all related assets are lost.
- **Approval Restriction (restricted_approval):** Whether the NFT contract can restrict approvals (preventing NFTs from being traded on marketplaces). "1" means true; "0" means false; "null" means unknown. _(If this risk exists, users cannot trade the NFT on exchanges; only whitelisted users could trade.)_
- **Oversupply Minting (oversupply_minting):** Whether the NFT owner can bypass the maximum mint amount specified in the contract and continue minting beyond the limit. "1" means true; "0" means false; "null" means unknown. _(Oversupply minting indicates the owner has a special mint method that ignores the stated max supply.)_

# dApp Security Info API

### Check risk of dApp through URL

**GET** <https://api.gopluslabs.io/api/v1/dapp_security/{dapp_url}>  
Check security info and risks of a decentralized application (dApp) via its URL.

#### Response Details

- **dApp Project Name (project_name):** The name of the dApp project.
- **dApp URL (url):** The website link of the dApp.
- **Contracts Security (contracts_security):** Security information for the dApp's smart contracts (array). For each contract, includes:
- chain_id – The blockchain on which the contract is deployed.
- contract_address – The contract's address.
- is_open_source – "1" if the contract is open source; "0" if not.
- malicious_contract – "1" if the contract is suspected to be malicious; "0" if not.
- malicious_behavior – Specific malicious behaviors of the contract (array).
- deployment_time – The deployed time of the contract.
- creator_address – The contract creator's address.
- malicious_creator – "1" if the creator address is suspected to be malicious; "0" if not.
- malicious_creator_behavior – Specific malicious behaviors of the creator (array).  
    _Note:_ A malicious_contract or malicious_creator value of "0" does not guarantee safety; it only means no malicious behavior was found in our analysis.
- **Is Audit (is_audit):** Whether the dApp was audited by a reputable firm. "1" means yes; "0" means no audit information found. _(A "0" return does not necessarily mean no audit was done, just that we have no record of it.)_
- **Audit Info (audit_info):** Audit information for the dApp. If available, includes:
- audit_time – The date of the latest audit report.
- audit_link – The URL of the audit report.
- audit_firm – The name of the audit firm.  
    (If is_audit = 0, this field returns null. If multiple audits exist, only the latest is shown.)
- **Trust List (trust_list):** Whether the dApp is recognized as famous and trustworthy. "1" means true; "0" means the dApp is not (yet) on our trusted list. _(Only "1" indicates a well-known, trusted dApp. A "0" does not necessarily imply the dApp is risky.)_

# Phishing Site Detection API

### Check if the URL is a phishing site

**GET** <https://api.gopluslabs.io/api/v1/phishing_site> (with query parameter url)  
Check if a given website URL is identified as a phishing site.

#### Response Details

The response includes a field indicating whether the URL is a known phishing site. For example:  
\- **phishing_site** – "1" means the URL is flagged as a phishing site; "0" means it is not flagged as phishing.

# Rug-Pull Detection API (Beta)

### Rug-pull risk assessment

**GET** <https://api.gopluslabs.io/api/v1/rugpull_detecting/{chain_id}>  
Check if a contract has potential rug-pull risks.

#### Response Details

- **Contract Owner (owner):** Information about the contract's owner, including:
- owner_name – Ownership function name (if any, e.g., "owner" or "admin"; "unknown" if not detected).
- owner_address – Owner address of the contract (null if not available).
- owner_type – Type of owner ("blackhole" if burn address, "contract", "eoa", "multi-address", or null if not detected).  
    _(If there is no owner function, or ownership is unreadable/private, this field may be empty.)_
- **Privilege Withdraw (privilege_withdraw):** Whether the contract owner can withdraw all assets in the contract without users' permission. "1" means yes; "0" means no; "-1" means unknown.
- **Cannot Withdraw (withdraw_missing):** Whether the contract lacks a withdrawal method. "1" means the contract has no withdrawal function (users cannot withdraw deposited assets); "0" means a withdrawal method exists; "-1" means unknown.
- **Contract Verified (is_open_source):** Whether the contract is open source (verified). "1" means true; "0" means false.
- **Blacklist (blacklist):** Whether the contract has a blacklist function that could block users from withdrawing assets. "1" means yes; "0" means no; "-1" means unknown.
- **Contract Name (contract_name):** Name of the contract.
- **Self-Destruct (selfdestruct):** Whether the contract can self-destruct. "1" means yes; "0" means no; "-1" means unknown.
- **Potential Approval Abuse (approval_abuse):** Whether the contract owner can spend token allowances (approvals) obtained by the contract (which could be abused to steal user assets). "1" means yes; "0" means no; "-1" means unknown. _(If is_proxy = 1 or is_open_source = 0, this often returns -1.)_
- **Proxy Contract (is_proxy):** Whether the contract is a proxy contract. "1" means true; "0" means false; "-1" means unknown.

# Token Security API for Solana (Beta)

### Get token's security and risk data (Solana)

**GET** <https://api.gopluslabs.io/api/v1/solana/token_security>  
Get security analysis for a Solana token (SPL or SPL-2022 standard).

#### Response Detail

Provides security analysis fields similar to the [Token Security API](#token-security-api) above, adapted for Solana tokens.

#### Supported Locker

List of token and liquidity locker platforms supported for Solana tokens (if applicable).

# Access Token API

### get token (obtain Access Token)

**POST** <https://api.gopluslabs.io/api/v1/token>  
Obtain an access token (for enhanced rate limits or special access).

#### Response Details

| Parameter | Description |
| --- | --- |
| access_token | API call credential (access token). |
| expires_in | The time to expiration of the access token, in seconds. |

# Transaction Simulation for Solana

### Check for potential risks in the transaction

**POST** <https://api.gopluslabs.io/pis/api/v1/solana/pre_execution>  
Simulate a Solana transaction to detect its outcome and any potential risks before execution.

#### Response Details

- **Basic Info:** Basic information about the simulated transaction:
- input – The input data of the transaction (usually the instructions or data payload).
- sender – The address of the transaction initiator.
- error – Error message if an error occurred during simulation (or "null" if none).
- logs – Logs generated during transaction execution (program call and execution logs).
- slot_height – The slot height at which the transaction simulation occurred.
- transaction_fee – The fee associated with the transaction (in lamports).
- **Asset Changes:** Changes in asset balances as a result of the transaction simulation:
- sol_changes: Changes in SOL (native token) balances for addresses involved. Each entry includes:
  - address – The address involved in the transaction.
  - from_address – Whether this address is the sender (1 for yes, 0 for no).
  - risky_address – Whether this address is flagged as risky (1 for yes, 0 for no).
  - pre_lamports – SOL balance of the address before the transaction.
  - post_lamports – SOL balance of the address after the transaction.
  - lamport_changes – The change in SOL balance (negative for loss, positive for gain).
- token_changes: Changes in balances of other (non-native) tokens. Each entry includes:
  - symbol – The token symbol.
  - mint – The token mint address.
  - decimals – The number of decimals of the token.
  - name – The token name.
  - change_detail: An array of balance change details for that token, where each element includes:
  - address – The token account address involved.
  - owner – The owner address of that token account.
  - from_address – 1 if this owner address is the sender, 0 otherwise.
  - risky_address – 1 if this owner address is flagged as risky, 0 otherwise.
  - pre_amount – Token balance of the address before the transaction.
  - post_amount – Token balance after the transaction.
  - amount_changes – The change in token balance.
- nft_changes: Changes in NFT balances. Structured similarly to token_changes (with decimals typically 0 for NFTs). For UniV3 LP positions, details of positions (value, NFT ID, etc.) are given in NFT_list.
- **Ownership Changes:** Information on changes in asset ownership caused by the transaction:
- Each entry includes:
  - symbol – Asset symbol.
  - mint – Asset mint address.
  - decimals – Asset decimals.
  - name – Asset name.
  - pre_owner – Owner address before the transaction.
  - post_owner – Owner address after the transaction.
  - owner_changed – 1 if ownership changed; 0 if not.
  - risky_post_owner – 1 if the new owner is flagged as malicious/risky; 0 if not.
- **Allowance Upgrades:** Information on changes to token allowances (approvals) from the transaction:
- Each entry includes:
  - symbol – Token symbol.
  - mint – Token mint address.
  - decimals – Token decimals.
  - name – Token name.
  - new_allowances: An array of allowance changes, each containing:
  - owner – Address of the token owner (who granted the allowance).
  - spender – Address of the spender (who received the allowance).
  - pre_amount – Allowance amount before the transaction.
  - post_amount – Allowance amount after the transaction.
  - allowance_change – Change in the allowance amount.
  - risky_spender – 1 if the spender address is flagged as risky; 0 otherwise.
- **Risk Info:** Summary of the risk assessment of the transaction:
- risky_txn – Indicates whether the transaction is considered risky ("1" for risky, "0" for not risky).
- risk_type – A list of risk type codes (each integer corresponds to a specific risk, e.g., **1** = "Transfer of >90% of SOL", **2** = "Transfer of >90% of a specific token", **3** = "Transfer of multiple assets at once", **4** = "Ownership of an asset transferred to a new address", **5** = "Ownerships of multiple assets transferred to a new address", **6** = "Ownership of an asset transferred to a malicious address", **7** = "Ownerships of multiple assets transferred to a malicious address", **8** = "Approve allowances for assets", **9** = "Transaction contains too many instructions").
- risk_detail – Detailed warnings describing why the transaction is flagged as risky (present if risky_txn = 1).

# Transaction Simulation API

### Transaction Simulation (EVM)

**POST** <https://api.gopluslabs.io/api/v1/transaction_simulation>  
Simulate an EVM transaction to assess the result and detect potential risks prior to execution.

_The response structure provides similar information to the Solana Transaction Simulation API above, including basic info, any asset/ownership changes, and a risk analysis for the EVM transaction._

# API Status Code

| Status Code | Description |
| --- | --- |
| 1   | Complete data prepared |
| 2   | Partial data obtained. The complete data can be requested again in ~15 seconds. |
| 2004 | Contract address format error! |
| 2018 | ChainID not supported |
| 2020 | Non-contract address |
| 2021 | No info for this contract |
| 2022 | Non-supported chainId |
| 2026 | dApp not found |
| 2027 | ABI not found |
| 2028 | The ABI not support parsing |
| 4010 | App_key not exist |
| 4011 | Signature expiration (duplicate request parameters) |
| 4012 | Wrong Signature |
| 4023 | Access token not found |
| 4029 | Request limit reached |
| 5000 | System error |
| 5006 | Param error! |

# API License Agreement

_Last Updated: August 21, 2023_

This API License Agreement (this "Agreement") is a binding contract between you ("you" or "your") and Tops Labs Ltd ("Company," "we," or "us"). This Agreement governs your access to and use of the Go+ Security application programming interface.

**BY ACCESSING OR USING THE API, YOU (A) ACKNOWLEDGE THAT YOU HAVE READ AND UNDERSTAND THIS AGREEMENT; (B) REPRESENT AND WARRANT THAT YOU HAVE THE RIGHT, POWER, AND AUTHORITY TO ENTER INTO THIS AGREEMENT; AND (C) ACCEPT THIS AGREEMENT AND AGREE THAT YOU ARE LEGALLY BOUND BY ITS TERMS. IF YOU DO NOT ACCEPT THESE TERMS, YOU MAY NOT ACCESS OR USE THE API.**

1. **Definitions.**  
    (a) "API" means the Go+ Security application programming interface and any API Documentation or other API materials made available by Company on its website (see [GoPlus Labs website](https://gopluslabs.io)).  
    (b) "API Documentation" means the API documentation described at [docs.gopluslabs.io](https://docs.gopluslabs.io/) from time to time.  
    (c) "API Key" means the security key Company makes available for you to access the API.  
    (d) "Company Marks" means Company's proprietary trademarks, trade names, branding, or logos made available for use in connection with the API pursuant to this Agreement.  
    (e) "Company Offering" means Company's operating system/software described at [gopluslabs.io](https://gopluslabs.io), the technology and application software made available by Company on a hosted basis as listed and described on that site.  
    (f) "Your Applications" means any applications developed by you to interact with the API.
2. **License Grants.** Subject to and conditioned on your compliance with all terms and conditions set forth in this Agreement, we hereby grant you an irrevocable, non-exclusive, royalty-free, transferable, sublicensable license during the term of the Agreement to use the API and display certain Company Marks (in compliance with usage guidelines we may specify) solely in connection with the use of the API and Your Applications. You may not share your API Key with any third party; you must keep your API Key and all log-in information secure, and you must use the API Key as your sole means of accessing the API. (Your API Key may be revoked by us at any time.)
3. **Attribution.** Except for personal usage, Your Application should provide attribution via a backlink or a mention that Your Application is “Powered by Go+ Security”.
4. **Your Applications.** You agree to monitor the use of Your Applications for any activity that violates applicable laws, rules, and regulations or any terms and conditions of this Agreement, including any fraudulent, inappropriate, or potentially harmful behavior, and to promptly restrict any offending users of Your Applications from further use. You agree to provide a resource for users of Your Applications to report abuse. As between you and us, you are responsible for all acts and omissions of your end users in connection with Your Applications and their use of the API. You agree that you are solely responsible for posting any required privacy notices and obtaining any necessary end user consents under applicable laws for their use of Your Applications. All use by you of the Company Marks, if any, will comply with any usage guidelines that we may specify from time to time. You agree that your use of the Company Marks in connection with this Agreement will not create any right, title, or interest in or to the Company Marks in your favor, and all goodwill associated with use of the Company Marks will inure to the benefit of Company.
5. **Display of GoPlus Logo.** You agree that if you use our services, you shall display our Company Mark (specifically, the GoPlus logo with "Powered by GoPlus"). If you use our API and fail to display our logo, we reserve the right to terminate this Agreement and seek damages for any loss. Note that GoPlus only provides API results; we do not recommend modifying our API results, nor will we be responsible for any such modifications in your front-end or back-end.
6. **Prohibited Actions and Misuses.** You shall not:
7. Engage in automated use of the Service (e.g., using scripts to send comments or messages, employing data mining, robots, or similar data gathering tools) to bypass any measures of the Service designed to prevent or restrict access, especially via web crawlers or proxies to circumvent our rate limits.
8. Use the Service for receipt collection or data mining without GoPlus's permission.
9. Use the Service as part of any effort to compete with us.
10. Decipher, decompile, disassemble, or reverse engineer any software comprising or in any way making up a part of the Service.
11. Use the Service in a manner inconsistent with any applicable laws or regulations.
12. Use our original data directly to conduct any commercial activities or generate revenue without GoPlus's explicit written permission.
13. **No Support; Updates.** This Agreement does not entitle you to any support for the API. You acknowledge that we may update or modify the API from time to time at our sole discretion (each an "Update"), and may require you to use the most recent version of the API. Updates may adversely affect how Your Applications interact with the Company Offering. You are responsible for making any changes to Your Applications required for compatibility as a result of such Update at your sole cost and expense. Your continued use of the API following an Update constitutes binding acceptance of the Update.
14. **No Fees.** You acknowledge and agree that no license fees or other payments are due under this Agreement in exchange for the rights granted hereunder. This arrangement is made in consideration of the mutual covenants in this Agreement, including the disclaimers, exclusions, and liability limitations below. Notwithstanding the foregoing, we reserve the right to begin charging for API access and use at any time.
15. **Collection and Use of Your Information.** We may collect certain information through the API or the Company Offering about you or any of your employees, contractors, or agents. By accessing, using, and providing information to or through the API or the Company Offering, you consent to all actions taken by us with respect to your information in compliance with our then-current privacy policy and data protection requirements (available on [gopluslabs.io](https://gopluslabs.io)).
16. **Intellectual Property Ownership.** As between you and us, (a) we own all right, title, and interest (including all intellectual property rights) in and to the API, the Company Offering, and the Company Marks; and (b) you own all right, title, and interest (including all intellectual property rights) in and to Your Applications, excluding our rights described in Section 10(a). You will promptly notify us if you become aware of any infringement of any intellectual property rights in the API or Company Marks, and will fully cooperate with us in any legal action taken to enforce our intellectual property rights.
17. **Disclaimer of Warranties.** THE API AND COMPANY MARKS ARE PROVIDED "AS IS" AND COMPANY SPECIFICALLY DISCLAIMS ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE. COMPANY SPECIFICALLY DISCLAIMS ALL IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT, AND ALL WARRANTIES ARISING FROM COURSE OF DEALING, USAGE, OR TRADE PRACTICE. COMPANY MAKES NO WARRANTY THAT THE API OR COMPANY MARKS, OR ANY PRODUCTS OR RESULTS OF USE, WILL MEET YOUR REQUIREMENTS, OPERATE WITHOUT INTERRUPTION, ACHIEVE ANY INTENDED RESULT, BE COMPATIBLE OR WORK WITH ANY SOFTWARE, SYSTEM, OR SERVICE, OR BE SECURE, ACCURATE, COMPLETE, FREE OF HARMFUL CODE, OR ERROR-FREE, OR THAT ANY ERRORS OR DEFECTS CAN OR WILL BE CORRECTED.
18. **Indemnification.** You agree to indemnify, defend, and hold harmless Company and its officers, directors, employees, agents, affiliates, successors, and assigns from and against any and all losses, damages, liabilities, deficiencies, claims, actions, judgments, settlements, interest, awards, penalties, fines, costs, or expenses (including reasonable attorneys' fees) arising from or relating to (a) your use or misuse of the API or Company Marks, (b) your breach of this Agreement, and (c) Your Applications (including any end user's use thereof). If we seek indemnification or defense from you under this provision, we will promptly notify you in writing of the claim(s) brought against us for which we seek indemnification or defense. We reserve the right, at our option and sole discretion, to assume full control of the defense of claims with legal counsel of our choice. You may not enter into any third-party agreement that affects us or admits fault by us without our prior written consent. If we assume control of the defense of such a claim, we will not settle any such claim requiring payment from you without your prior written approval.
19. **Limitations of Liability.** TO THE FULLEST EXTENT PERMITTED UNDER APPLICABLE LAW, IN NO EVENT WILL WE BE LIABLE TO YOU OR TO ANY THIRD PARTY UNDER ANY TORT, CONTRACT, NEGLIGENCE, STRICT LIABILITY, OR OTHER LEGAL OR EQUITABLE THEORY FOR: (a) ANY LOST PROFITS, LOST OR CORRUPTED DATA, COMPUTER FAILURE OR MALFUNCTION, INTERRUPTION OF BUSINESS, OR OTHER SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF THE USE OR INABILITY TO USE THE API; OR (b) ANY DAMAGES, IN THE AGGREGATE, IN EXCESS OF FIFTY U.S. DOLLARS ($50). EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES, AND WHETHER OR NOT SUCH DAMAGES ARE FORESEEABLE.
20. **Term and Termination.** This Agreement commences when you execute it (by using the API) and will continue until terminated as set forth herein. We may immediately terminate or suspend this Agreement, any rights granted herein, and/or your licenses under this Agreement, at our sole discretion at any time for any reason, by notifying you or revoking API and Company Marks access. Additionally, this Agreement will terminate immediately and automatically without notice if you violate any of its terms. You may terminate this Agreement at any time by ceasing your access to and use of the API and Company Marks.
21. **Modifications.** You acknowledge and agree that we have the right, in our sole discretion, to modify this Agreement from time to time. You will be notified of modifications through notifications or posts on [docs.gopluslabs.io](https://docs.gopluslabs.io/) or via direct email from us. You are responsible for reviewing and becoming familiar with any such modifications.
22. **Governing Law and Jurisdiction.** This Agreement is governed by and construed in accordance with the internal laws of the State of New York, without giving effect to any choice or conflict of law rules that would cause the application of the laws of any jurisdiction other than those of New York. Except as otherwise set forth herein, any legal suit, action, or proceeding arising out of or related to this Agreement or the licenses granted hereunder will be instituted exclusively in the federal courts of the United States or the courts of the State of New York, in each case located in New York City, and each party irrevocably submits to the exclusive jurisdiction of such courts.
23. **Miscellaneous.** This Agreement constitutes the entire agreement and understanding between the parties with respect to its subject matter and supersedes all prior and contemporaneous understandings, agreements, representations, and warranties, both written and oral, with respect to such subject matter. This Agreement is personal to you and may not be assigned or transferred for any reason whatsoever without our prior written consent; any attempt to do so without consent will be void. We expressly reserve the right to assign this Agreement and to delegate any of our obligations hereunder.

# Support

#### Rate Limits

GoPlus Security API usage is free, and the rate limit is **30 calls per minute**. If you require a higher limit than the default, please contact us to apply for an access token (see the Access Token API above).

#### Contact us for help

If you have any questions or need support, email us at [service@gopluslabs.io](mailto:%5Bemail%C2%A0protected%5D). Beware of phishing attempts and emails impersonating the GoPlus team.