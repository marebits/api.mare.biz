import { ERC20 } from "./ERC20.mjs";

export class MareBits extends ERC20 {
	static ABI_FILE = "./abi/MareBits.json";

	get [globalThis.Symbol.toStringTag]() { return "MareBits"; }

	async decimals() { return (await this.contract).methods.decimals().call({}); }
	async name() { return (await this.contract).methods.name().call({}); }
	async owner() { return (await this.contract).methods.owner().call({}); }
	async symbol() { return (await this.contract).methods.symbol().call({}); }
}