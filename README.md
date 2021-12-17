# api.mare.biz

The code for the $MARE API, a quick and dirty attempt to provide an interface to help speed the adoption of $MARE technology.  Please see <https://mare.biz/> for more information about $MARE Bits.

[Releases](../../releases) correspond to versions of this site as published.

## Introduction

This API loosely implements the [JSON:API](https://jsonapi.org/) specification (except using and requiring the `application/vnd.api+json` MIME type, it is currently using `application/json`).  It also only currently recognizes `GET` requests, and not `HEAD`.  All parameters are currently passed through URL query strings (though supporting `POST` is in the plan at some point).  The API can only be accessed over a secure HTTP connection at `https://api.mare.biz`.  All responses are returned as JSON objects.

## Using the API

### Definitions

Some quick definitions that will make the rest of this document easier to understand (hopefully).

<dl>
<dt><abbr title="Ethereum Name Service">ENS</abbr></dt>
<dd>The <a href="//ens.domains/">Ethereum Name Service</a> is the most recognized NFT-based domain name service on Ethereum.  Allows users to register domain names that resolve to cryptocurrency addresses.  These domains usually end in <code>.eth</code> but they now support registering almost any real-world TLD as well.</dd>
<dt><abbr title="Unstoppable Name Service">UNS</abbr></dt>
<dd>The alternative to ENS is the Unstoppable Name Service run by <a href="//unstoppabledomains.com/">UnstoppableDomains</a>.  This is another NFT-based domain name service that works on both Ethereum and Polygon.  It allows users to register domain names that resolve to cryptocurrency addresses.  These domains end in <code>.crypto</code>, <code>.x</code>, <code>.bitcoin</code>, <code>.wallet</code>, and many others.</dd>
<dt>Ethereum Address Checksum</dt>
<dd>Since Ethereum didn't have a method of checksumming addresses when it was released, many methods were eventually invented to do so.  Currently, the most popular method is <a href="/ethereum/EIPs/blob/master/EIPS/eip-55.md">EIP-55</a> which uses the capitalization of the alpha components of the Ethereum address.</dd>
</dl>

### Return value

All returned objects correspond loosely to the JSON:API specification.  Each one will have an `id` and a `type`.  They may optionally have a `data` or `errors` object.  The `data` object contains one or more `address` objects and the `errors` is an array of errors (if any).

### Objects

#### Address

Addresses represent a wallet or contract on the Ethereum or Polygon network.

##### `/balanceOf?address=<address>`

If a valid address is input, the `data` object will contain a representation of the `address` object.  If more than one result is found, `data` will be an array of `address` objects.

When a valid address is input, the `id` field will be a 42 character hexadecimal string prefixed with `0x` representing the address on the blockchain.  If the address was modified (either resolved via ENS or UNS or checksummed), the original input value will be located in one or more `meta.input` entries.  If an invalid address is input, the `id` field will be an unmodified representation of the input value.  The `type` will always be `address`.

The `meta.input` field will be populated with the original address(es) as entered if it was resolved or modified during checksum.  The `meta.error` field may be populated with an `Invalid Address` error if the address is invalid.

For valid addresses, the `attributes.balances` object will contain one entry each for the `ethereum` and `polygon` chains along with a `total`.  These are the address's $MARE balances represented as a string.

#### MareBits

This object represents the [Mare Bits](https://mare.biz/) token contract, on both the Ethereum and Polygon chains.  Its `id` will always be `ethereum:contract.marebits.eth` (the most human readable URI).

##### `/circulatingSupply`

Returns the total circulating supply on both the Ethereum and Polygon chains.  This is defined as the supply currently in possession of the general public and the market, which is equivalent to the total number of tokens minted excluding those tokens burned, locked, or in the possession of the developer or project itself.

```
circulatingSupply = totalTokens - tokensBurned - tokensLocked - tokensOwnedByDeveloper - tokensOwnedByProject
```


##### `/totalSupply`

Returns the total supply of tokens on both the Ethereum and Polygon chains.  This is defined as the total number of tokens in existence, which is equivalent to the total number of tokens minted excluding those tokens burned.

```
totalSupply = totalTokens - tokensBurned
```