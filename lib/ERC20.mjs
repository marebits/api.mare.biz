import { Contract } from "./Contract.mjs";

export class ERC20 extends Contract {
	static ABI_FILE = "./abi/IERC20.json";

	get [globalThis.Symbol.toStringTag]() { return "ERC20"; }

	async allowance(owner, spender) { return (await this.contract).methods.allowance(owner, spender).call({}); }
	async balanceOf(account) { return (await this.contract).methods.balanceOf(account).call({}); }
	async totalSupply() { return (await this.contract).methods.totalSupply().call({}); }
}