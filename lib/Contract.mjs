import { readFile } from "fs/promises";

const _privates = {};

export class Contract {
	static ABI_FILE = "";

	static get abi() {
		if (typeof(_privates.abi) === "undefined")
			return _privates.abi = readFile(this.ABI_FILE, { encoding: "utf8" }).then(abi => globalThis.JSON.parse(abi)).catch(console.error);
		return _privates.abi;
	}

	#contract;
	#contractAddress = "";
	#web3;

	constructor(contractAddress, web3) { [this.#contractAddress, this.#web3] = [contractAddress, web3]; }

	get [globalThis.Symbol.toStringTag]() { return "Contract"; }

	get contract() {
		if (typeof(this.#contract) === "undefined")
			return this.#contract = this.constructor.abi.then(abi => new this.#web3.eth.Contract(abi, this.#contractAddress)).catch(console.error);
		return this.#contract;
	}
}