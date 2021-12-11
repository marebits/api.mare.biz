"use strict";

import { Address } from "./lib/Address.mjs";
import { Addresses } from "./lib/Addresses.mjs";
import { APIError } from "./lib/APIError.mjs";
import { APIResponse } from "./lib/APIResponse.mjs";
import { createAlchemyWeb3 } from "@alch/alchemy-web3";
import http from "http";
import { readFileSync } from "fs";

const Secrets = globalThis.JSON.parse(readFileSync("./secrets.json"));

class MareBitsAPI extends APIResponse {
	static MARE_BITS_CONTRACT_ADDRESS = { ETHEREUM: "0xc5a1973e1f736e2ad991573f3649f4f4a44c3028", POLYGON: "0xb362a97ad06c907c4b575d3503fb9dc474498480" };
	static MAX_SIMULTANEOUS_REQUESTS = 6;
	static SERVER_URI = "https://api.mare.biz";
	static ZERO_ADDRESS = "0x0000000000000000000000000000000000000000000000000000000000000000";

	static #server;

	static get web3() { return { ethereum: createAlchemyWeb3(Secrets.ALCHEMY_API_KEY_ETHEREUM), polygon: createAlchemyWeb3(Secrets.ALCHEMY_API_KEY_POLYGON) }; }

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
		this.#requestUrl = new globalThis.URL(this.#request.url, this.constructor.SERVER_URI);
		let endpoint;

		if (this.#request.method === "GET") {
			this.#web3 = this.constructor.web3;

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

			if (j >= this.constructor.MAX_SIMULTANEOUS_REQUESTS)
				return this.addError(new APIError({ detail: `Too many simultaneous requests, unable to get balance for address \`${address}\`.`, title: "Too Many Simultaneous Requests" }));
			dataArrayPromise.ethereum[i] = promiseToGetBalance(this.#web3.ethereum.alchemy.getTokenBalances.bind(undefined, address.id, [this.constructor.MARE_BITS_CONTRACT_ADDRESS.ETHEREUM]))
				.catch(this.#errorHandler.bind(this));
			dataArrayPromise.polygon[i] = promiseToGetBalance(this.#web3.polygon.alchemy.getTokenBalances.bind(undefined, address.id, [this.constructor.MARE_BITS_CONTRACT_ADDRESS.POLYGON]))
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
		this.#write(this);
		this.#response.end();
	}
	#getAddresses() { return (new Addresses(this.#requestUrl.searchParams.getAll("address"))).normalize(this.#web3.ethereum); }
	#write(message) { this.#response.write(globalThis.JSON.stringify(message)); }
	#writeHead() {
		if (this.#isHeadWritten)
			return;
		this.#response.writeHead(this.#status, { "Content-Type": "application/json", "X-Best-Pony": "Twilight Sparkle" });
		this.#isHeadWritten = true;
	}
}

MareBitsAPI.startListening();