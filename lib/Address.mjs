import { APIResource } from "./APIResource.mjs";
import { Cache } from "./Cache.mjs";
import { Resolution } from "@unstoppabledomains/resolution";

export class Address extends APIResource {
	static #cache = new Cache(60 * 60, 2 * 60 * 60);

	static get resolution() {
		delete this.resolution;
		return this.resolution = new Resolution();
	}

	get type() { return "address"; }

	addMetaInput(metaInput) {
		if (typeof(metaInput) === "undefined")
			return this;
		else if (typeof(this.meta) === "undefined" || typeof(this.meta.input) === "undefined")
			return this.addMeta({ input: metaInput });
		const isMetaInputArray = globalThis.Array.isArray(this.meta.input);

		if (globalThis.Array.isArray(metaInput)) {
			if (isMetaInputArray)
				this.meta.input.push(...metaInput);
			else {
				metaInput.push(this.meta.input);
				this.addMeta({ input: metaInput });
			}
		} else {
			if (isMetaInputArray)
				this.meta.input.push(metaInput);
			else
				this.addMeta({ input: [this.meta.input, metaInput] });
		}
		return this;
	}
	async normalize(web3) {
		const addressNoChecksum = this.id.toLowerCase();

		if (web3.utils.isAddress(addressNoChecksum)) {
			const addressChecksum = web3.utils.toChecksumAddress(addressNoChecksum);

			if (this.id !== addressChecksum)
				this.addMetaInput(this.id).setId(addressChecksum);
		} else {
			const cachedValue = this.constructor.#cache.get(addressNoChecksum);

			if (typeof(cachedValue) !== "undefined")
				this.addMetaInput(this.id).setId(cachedValue);
			else {
				try {
					const resolvedAddress = await web3.eth.ens.getAddress(this.id);
					this.#setResolvedAddress(web3.utils.toChecksumAddress, addressNoChecksum, resolvedAddress);
				} catch {
					try {
						const resolvedAddress = await this.constructor.resolution.addr(this.id, "ETH");
						this.#setResolvedAddress(web3.utils.toChecksumAddress, addressNoChecksum, resolvedAddress);
					}
					catch {
						this.addMeta({ error: "Invalid Address" });
					}
				}
			}
		}
		return this;
	}
	#setResolvedAddress(toChecksumAddress, addressNoChecksum, resolvedAddress) {
		this.addMetaInput(this.id).setId(toChecksumAddress(resolvedAddress.toLowerCase()));
		this.constructor.#cache.set(addressNoChecksum, this.id);
	}
}