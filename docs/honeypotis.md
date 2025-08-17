# Honeypot API Documentation

Use the Honeypot API to integrate honeypot checks into your product.

Currently, API authentication is not required. You can skip the authentication steps.

[Quickstart](#quickstart)

## Terms of Service

Please read the [Terms of Service](#api-terms-and-conditions) before using the API.

## Getting started

To get started, retrieve your API key.

**IMPORTANT!** API Key system is not yet implemented. Link will not work. You do NOT need to provide an API key to use the API at this time. Please keep an eye out on [t.me](https://t.me/honeypotis_news) for updates.

**Get your API key**

## Guides

### Authentication 

Learn how to authenticate your API requests.

[Read more](#authorization)

### Chains 

See what chains and exchanges are supported by the API.

[Read more](#chains)

### Errors 

Read about the different types of errors returned by the API.

[Read more](#errors)

### Premium API 

Learn about the premium API offered by Honeypot API.

[Read more](#premium-api)

## Resources

### [Honeypot Checks](#honeypot-checks)

Learn how to check if a token is a honeypot or not, and get the various details, such as taxes and gas for a token.

### [Contracts](#contract-verification)

Learn about leveraging our powerful system to check if a contract is truly open source.

### [Pairs](#pairs)

Learn about retrieving pair information using the Honeypot API.

### [Top Holders](#top-holders)

Learn about retrieving the top holders of a token using the Honeypot API.

# API Terms and Conditions

*Last Update: 2023-12-05*

Acceptance of Terms: The user (“User”) agrees that by accessing and using the Application Programming Interface (API), they are affirming their acceptance of and compliance with these Terms and Conditions (Terms). These Terms constitute a legally binding agreement between the User and honeypot.is ("We", "Us", "Our", "honeypot.is"). The use of the API is subject to these Terms, and any use of the API constitutes a declaration of the User’s consent to all terms and conditions contained herein.

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

This guide will get you all set up and ready to use the Honeypot API. We’ll cover how to get started and how to make your first API request. We'll also look at where to go next to find all the information you need to take full advantage of our powerful API.

~~Before you can make requests to the Honeypot API, you will need to grab your API key from your dashboard. You find it under Settings » API.~~ 

*API Keys are currently not required - please leave the API key out of your requests in order.*

This will change in the near future.

## Client

All Honeypot requests are made through HTTPS requests to the `api.honeypot.is` domain. All responses are returned as JSON objects. You can use any HTTP capable client to make requests to the API.

```bash
# cURL is most likely already installed on your machine
curl --version
```

## Making your first API request

After you've gotten your API key, you can start making requests to the Honeypot API. Below, you can see how to send a GET request to the IsHoneypot endpoint to check if a token is a honeypot.

**GET** `/v2/IsHoneypot`

```bash
curl -G https://api.honeypot.is/v2/IsHoneypot   -H "X-API-KEY: {APIKEY}"   -d address=0x0
```

[Read the docs for the IsHoneypot endpoint](#honeypot-checks)

## What's next?

Great, you're now set up with an API client and have made your first request to the API. Here are a few links that might be handy as you venture further into the Honeypot.is API:

- Grab your API key from the dashboard  
- [Learn how to authenticate your requests](#authorization)  
- [Check out the IsHoneypot endpoint](#honeypot-checks)  
- [Learn about the different error messages in Honeypot.is](#errors)

# Authorization
... (continues with full documentation content previously provided)
