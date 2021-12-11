import { Address } from "./Address.mjs";

export class Addresses extends globalThis.Array {
	constructor(addresses) {
		super();

		if (typeof(addresses) !== "undefined" && typeof(addresses.forEach) !== "undefined")
			addresses.forEach((address, i) => this[i] = (address instanceof Address) ? address : new Address({ id: address }));
	}
	async normalize(web3) {
		let normalized = await globalThis.Promise.all(this.map(address => address.normalize(web3)));
		normalized.sort((first, second) => (first.id < second.id) ? -1 : (first.id > second.id) ? 1 : 0);
		return normalized.reduce((reduced, address, i) => {
			if (i == normalized.length - 1)
				reduced.push(address);
			else {
				const j = normalized.slice(i + 1).findIndex((targetAddress) => address.id === targetAddress.id);

				if (j >= 0) {
					const k = i + j + 1;

					if (typeof(address.meta) === "undefined" || typeof(address.meta.input) === "undefined")
						address.addMetaInput(address.id);

					if (typeof(normalized[k].meta) === "undefined" || typeof(normalized[k].meta.input) === "undefined")
						normalized[k].addMetaInput([normalized[k].id, address.meta.input]);
					else
						normalized[k].addMetaInput(address.meta.input);
				}
				else
					reduced.push(address);
			}
			return reduced;
		}, new this.constructor());
	}
}