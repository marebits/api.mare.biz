"use strict";

import { Address } from "./lib/Address.mjs";
import { Addresses } from "./lib/Addresses.mjs";
import { APIError } from "./lib/APIError.mjs";
import { APIResponse } from "./lib/APIResponse.mjs";
import { Cache } from "./lib/Cache.mjs";
import { createAlchemyWeb3 } from "@alch/alchemy-web3";
import { createHash } from "crypto";
import http from "http";
import { readFileSync } from "fs";

const Secrets = globalThis.JSON.parse(readFileSync("./secrets.json"));

class MareBitsAPI extends APIResponse {
	static #MARE_BITS_CONTRACT_ADDRESS = { ETHEREUM: "0xc5a1973e1f736e2ad991573f3649f4f4a44c3028", POLYGON: "0xb362a97ad06c907c4b575d3503fb9dc474498480" };
	static #MAX_SIMULTANEOUS_REQUESTS = 6;
	static #SERVER_URI = "https://api.mare.biz";

	static #cache = new Cache();
	static #server;

	static #getWeb3() { return { ethereum: createAlchemyWeb3(Secrets.ALCHEMY_API_KEY_ETHEREUM), polygon: createAlchemyWeb3(Secrets.ALCHEMY_API_KEY_POLYGON) }; }

	static listener(request, response) { return new this(request, response); }
	static startListening() {
		this.#server = http.createServer(this.listener.bind(this));
		this.#server.listen(62737);
	}

	#isHeadWritten = false;
	#request;
	#requestUrl;
	#response;
	#status = 200;
	#web3;

	constructor(request, response) {
		super();
		[this.#request, this.#response] = [request, response];
		this.#requestUrl = new globalThis.URL(this.#request.url, this.constructor.#SERVER_URI);
		let endpoint;

		if (this.#isCached)
			endpoint = async () => this.#status = this.#cachedResponse.status;
		else if (this.#request.method === "OPTIONS") {
			switch (this.#requestUrl.pathname) {
				case "*":
				case "/balanceOf":
					this.#response.setHeader("Allow", "GET, HEAD, OPTIONS"); break;
			}
			endpoint = async () => this.#status = 204;
		} else if (this.#request.method === "GET" || this.#request.method === "HEAD") {
			this.#web3 = this.constructor.#getWeb3();

			switch (this.#requestUrl.pathname) {
				case "/balanceOf": endpoint = this.#balanceOf; break;
				default: 
					endpoint = async () => {
						this.addError(new APIError({ detail: `The \`${this.#requestUrl.pathname}\` endpoint is unsupported.`, title: "Unsupported Method", status: "404" }));
						this.#status = 404;
					};
			}
		} else
			endpoint = async () => {
				this.addError(new APIError({ detail: `Server does not support request method \`${this.#request.method}\``, title: "Unimplemented Request Method", status: "501" }));
				this.#status = 501;
			};
		endpoint.call(this)
			.catch(this.#errorHandler.bind(this))
			.then(() => this.#end())
			.catch(console.error);
	}

	get [globalThis.Symbol.toStringTag]() { return "MareBitsAPI"; }
	get #cachedResponse() { return this.constructor.#cache.get(this.#cacheKey); }
	get #cacheKey() { return globalThis.JSON.stringify({ method: this.#request.method, url: this.#requestUrl.toString() }); }
	get #isCached() { return typeof(this.#cachedResponse) !== "undefined"; }
	get #message() { return this.#isCached ? this.#cachedResponse.message : globalThis.JSON.stringify(this); }
	get #messageHash() {
		const hash = createHash("sha256");
		hash.update(this.#message);
		return hash.digest().toString("base64");
	}

	async #balanceOf() {
		const addresses = await this.#getAddresses();

		if (addresses.length === 0)
			return;
		const dataArrayPromise = { ethereum: [], polygon: [] };
		const promiseToGetBalance = async (balanceGetter) => {
			const result = await balanceGetter.call(undefined);

			if ("tokenBalances" in result && result.tokenBalances.length > 0 && "tokenBalance" in result.tokenBalances[0] && result.tokenBalances[0].tokenBalance != null)
				return this.#web3.ethereum.utils.toBN(result.tokenBalances[0].tokenBalance);
			return this.#web3.ethereum.utils.toBN("0");
		};
		let j = 0;
		await addresses.forEach(async (address, i) => {
			if (typeof(address.meta.error) !== "undefined")
				return this.addError(new APIError({ detail: `Address \`${address.id}\` is not a valid address.`, title: "Invalid Address" }));

			if (j >= this.constructor.#MAX_SIMULTANEOUS_REQUESTS)
				return this.addError(new APIError({ detail: `Too many simultaneous requests, unable to get balance for address \`${address}\`.`, title: "Too Many Simultaneous Requests" }));
			dataArrayPromise.ethereum[i] = promiseToGetBalance(this.#web3.ethereum.alchemy.getTokenBalances.bind(undefined, address.id, [this.constructor.#MARE_BITS_CONTRACT_ADDRESS.ETHEREUM]))
				.catch(this.#errorHandler.bind(this));
			dataArrayPromise.polygon[i] = promiseToGetBalance(this.#web3.polygon.alchemy.getTokenBalances.bind(undefined, address.id, [this.constructor.#MARE_BITS_CONTRACT_ADDRESS.POLYGON]))
				.catch(this.#errorHandler.bind(this));
			j++;
		});
		const dataArray = { ethereum: await globalThis.Promise.all(dataArrayPromise.ethereum), polygon: await globalThis.Promise.all(dataArrayPromise.polygon) };
		addresses.forEach((address, i) => {
			if (typeof(dataArrayPromise.ethereum[i]) !== "undefined")
				address.addAttribute({
					balances: {
						ethereum: this.#web3.ethereum.utils.fromWei(dataArray.ethereum[i]), 
						polygon: this.#web3.polygon.utils.fromWei(dataArray.polygon[i]), 
						total: this.#web3.ethereum.utils.fromWei(dataArray.ethereum[i].add(dataArray.polygon[i]))
					}
				});
			this.addData(address);
		});
	}
	#errorHandler(err) {
		if (err instanceof globalThis.Error)
			this.addError(new APIError({ detail: err.message, title: err.name }));
		else
			this.addError(new APIError({ detail: err.toString() }));
		throw err;
	}
	#end() {
		this.#writeHead();

		if (this.#request.method === "GET")
			this.#response.write(this.#message);
		this.#response.end();

		if (!this.#isCached)
			this.constructor.#cache.set(this.#cacheKey, { message: this.#message, status: this.#status });
	}
	#getAddresses() { return (new Addresses(this.#requestUrl.searchParams.getAll("address"))).normalize(this.#web3.ethereum); }
	#writeHead() {
		if (this.#isHeadWritten)
			return;
		this.#response.writeHead(this.#status, {
			"Access-Control-Allow-Origin": "*", 
			"Content-Length": (new globalThis.TextEncoder().encode(this.#message)).length,
			"Content-Type": "application/json", 
			ETag: this.#messageHash, 
			Server: "api.mare.biz/1.0.0", 
			"X-Best-Pony": "Twilight Sparkle"
		});
		this.#isHeadWritten = true;
	}
}

MareBitsAPI.startListening();