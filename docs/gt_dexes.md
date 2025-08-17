# GeckoTerminal API

## GET /networks/{network}/dexes

- Take gt_networks.md example result, extract network IDs into a JSON with the info, then populate it with the network's DEXes with `GET /networks/{network}/dexes` taking the respone, like this example:

Response (eth)

```json
{
  "data": [
    {
      "id": "uniswap_v2",
      "type": "dex",
      "attributes": {
        "name": "Uniswap V2"
      }
    },
    {
      "id": "sushiswap",
      "type": "dex",
      "attributes": {
        "name": "SushiSwap"
      }
    },
    {
      "id": "uniswap_v3",
      "type": "dex",
      "attributes": {
        "name": "Uniswap V3"
      }
    },
    {
      "id": "shibaswap",
      "type": "dex",
      "attributes": {
        "name": "Shibaswap"
      }
    },
    {
      "id": "templedao",
      "type": "dex",
      "attributes": {
        "name": "TempleDAO"
      }
    },
    {
      "id": "standard_ethereum",
      "type": "dex",
      "attributes": {
        "name": "Standard (Ethereum)"
      }
    },
    {
      "id": "swapr_ethereum",
      "type": "dex",
      "attributes": {
        "name": "Swapr (Ethereum)"
      }
    },
    {
      "id": "degenswap",
      "type": "dex",
      "attributes": {
        "name": "DegenSwap"
      }
    },
    {
      "id": "concave",
      "type": "dex",
      "attributes": {
        "name": "Concave"
      }
    },
    {
      "id": "radioshack_ethereum",
      "type": "dex",
      "attributes": {
        "name": "RadioShack (Ethereum)"
      }
    },
    {
      "id": "elk_finance_ethereum",
      "type": "dex",
      "attributes": {
        "name": "Elk Finance (Ethereum)"
      }
    },
    {
      "id": "integral_size",
      "type": "dex",
      "attributes": {
        "name": "Integral SIZE"
      }
    },
    {
      "id": "kyberswap_elastic",
      "type": "dex",
      "attributes": {
        "name": "KyberSwap Elastic"
      }
    },
    {
      "id": "fraxswap_ethereum",
      "type": "dex",
      "attributes": {
        "name": "Fraxswap (Ethereum)"
      }
    },
    {
      "id": "defi_swap",
      "type": "dex",
      "attributes": {
        "name": "Defi Swap"
      }
    },
    {
      "id": "curve",
      "type": "dex",
      "attributes": {
        "name": "Curve"
      }
    },
    {
      "id": "apeswap_ethereum",
      "type": "dex",
      "attributes": {
        "name": "ApeSwap (Ethereum)"
      }
    },
    {
      "id": "sakeswap",
      "type": "dex",
      "attributes": {
        "name": "SakeSwap"
      }
    },
    {
      "id": "dooar_ethereum",
      "type": "dex",
      "attributes": {
        "name": "DOOAR (Ethereum)"
      }
    },
    {
      "id": "spice_trade_ethereum",
      "type": "dex",
      "attributes": {
        "name": "Spice Trade (Ethereum)"
      }
    },
    {
      "id": "unicly",
      "type": "dex",
      "attributes": {
        "name": "Unicly"
      }
    },
    {
      "id": "verse",
      "type": "dex",
      "attributes": {
        "name": "Verse"
      }
    },
    {
      "id": "pancakeswap_ethereum",
      "type": "dex",
      "attributes": {
        "name": "Pancakeswap (Ethereum)"
      }
    },
    {
      "id": "kyberswap_classic_ethereum",
      "type": "dex",
      "attributes": {
        "name": "Kyberswap Classic (Ethereum)"
      }
    },
    {
      "id": "safemoonswap_ethereum",
      "type": "dex",
      "attributes": {
        "name": "SafemoonSwap (Ethereum)"
      }
    },
    {
      "id": "balancer_ethereum",
      "type": "dex",
      "attributes": {
        "name": "Balancer V2 (Ethereum)"
      }
    },
    {
      "id": "solidlydex",
      "type": "dex",
      "attributes": {
        "name": "Solidly"
      }
    },
    {
      "id": "antfarm-ethereum",
      "type": "dex",
      "attributes": {
        "name": "Antfarm (Ethereum)"
      }
    },
    {
      "id": "pancakeswap-v3-ethereum",
      "type": "dex",
      "attributes": {
        "name": "Pancakeswap V3 (Ethereum)"
      }
    },
    {
      "id": "smardex-ethereum",
      "type": "dex",
      "attributes": {
        "name": "SmarDex (Ethereum)"
      }
    },
    {
      "id": "whiteswap",
      "type": "dex",
      "attributes": {
        "name": "Whiteswap"
      }
    },
    {
      "id": "saitaswap-ethereum",
      "type": "dex",
      "attributes": {
        "name": "Saitaswap (Ethereum)"
      }
    },
    {
      "id": "surge-protocol-eth",
      "type": "dex",
      "attributes": {
        "name": "Surge Protocol (ETH)"
      }
    },
    {
      "id": "sashimiswap",
      "type": "dex",
      "attributes": {
        "name": "Sashimiswap"
      }
    },
    {
      "id": "pepedex",
      "type": "dex",
      "attributes": {
        "name": "Pepedex"
      }
    },
    {
      "id": "x7-finance",
      "type": "dex",
      "attributes": {
        "name": "x7 Finance"
      }
    },
    {
      "id": "traderjoe-v2-1-ethereum",
      "type": "dex",
      "attributes": {
        "name": "LFJ V2.1 (Ethereum)"
      }
    },
    {
      "id": "hopeswap",
      "type": "dex",
      "attributes": {
        "name": "HopeSwap"
      }
    },
    {
      "id": "dex-on-crypto-ethereum",
      "type": "dex",
      "attributes": {
        "name": "Dex on Crypto (Ethereum)"
      }
    },
    {
      "id": "sushiswap-v3-ethereum",
      "type": "dex",
      "attributes": {
        "name": "SushiSwap V3 (Ethereum)"
      }
    },
    {
      "id": "solidly-v3",
      "type": "dex",
      "attributes": {
        "name": "Solidly V3"
      }
    },
    {
      "id": "9inch-ethereum",
      "type": "dex",
      "attributes": {
        "name": "9inch (Ethereum)"
      }
    },
    {
      "id": "justmoney-ethereum",
      "type": "dex",
      "attributes": {
        "name": "JustMoney (Ethereum)"
      }
    },
    {
      "id": "wagmi-ethereum",
      "type": "dex",
      "attributes": {
        "name": "WAGMI (Ethereum)"
      }
    },
    {
      "id": "lif3-ethereum",
      "type": "dex",
      "attributes": {
        "name": "Lif3 (Ethereum)"
      }
    },
    {
      "id": "bitswap",
      "type": "dex",
      "attributes": {
        "name": "BitSwap"
      }
    },
    {
      "id": "blueprint",
      "type": "dex",
      "attributes": {
        "name": "Blueprint"
      }
    },
    {
      "id": "orion-ethereum",
      "type": "dex",
      "attributes": {
        "name": "Orion (Ethereum)"
      }
    },
    {
      "id": "vvs-v3-ethereum",
      "type": "dex",
      "attributes": {
        "name": "VVS V3 (Ethereum)"
      }
    },
    {
      "id": "convergence-finance-v2",
      "type": "dex",
      "attributes": {
        "name": "Convergence Finance V2"
      }
    },
    {
      "id": "archly-ethereum",
      "type": "dex",
      "attributes": {
        "name": "Archly (Ethereum)"
      }
    },
    {
      "id": "marswap-ethereum",
      "type": "dex",
      "attributes": {
        "name": "MarSwap (Ethereum)"
      }
    },
    {
      "id": "ethervista",
      "type": "dex",
      "attributes": {
        "name": "Ethervista"
      }
    },
    {
      "id": "pancakeswap-stableswap-ethereum",
      "type": "dex",
      "attributes": {
        "name": "PancakeSwap Stableswap (Ethereum)"
      }
    },
    {
      "id": "x7-finance-ethereum",
      "type": "dex",
      "attributes": {
        "name": "Xchange (Ethereum)"
      }
    },
    {
      "id": "uniswap-v4-ethereum",
      "type": "dex",
      "attributes": {
        "name": "Uniswap V4 (Ethereum)"
      }
    },
    {
      "id": "maverick-v2-eth",
      "type": "dex",
      "attributes": {
        "name": "Maverick V2 (Ethereum)"
      }
    },
    {
      "id": "deltaswap-ethereum",
      "type": "dex",
      "attributes": {
        "name": "Deltaswap (Ethereum)"
      }
    },
    {
      "id": "ring-exchange-ethereum",
      "type": "dex",
      "attributes": {
        "name": "Ring Exchange (Ethereum)"
      }
    },
    {
      "id": "ekubo-ethereum",
      "type": "dex",
      "attributes": {
        "name": "Ekubo (Ethereum)"
      }
    },
    {
      "id": "bunni-ethereum",
      "type": "dex",
      "attributes": {
        "name": "Bunni (Ethereum)"
      }
    },
    {
      "id": "balancer-v3-ethereum",
      "type": "dex",
      "attributes": {
        "name": "Balancer V3 (Ethereum)"
      }
    }
  ],
  "links": {
    "first": "https://api.geckoterminal.com/api/v2/networks/eth/dexes?page=1",
    "prev": null,
    "next": null,
    "last": "https://api.geckoterminal.com/api/v2/networks/eth/dexes?page=1"
  }
}
```