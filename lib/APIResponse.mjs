export class APIResponse {
	#data;
	#errors;
	#included;
	#links;
	#meta;

	constructor({ data, errors, included, links, meta } = {}) { [this.#data, this.#errors, this.#included, this.#links, this.#meta] = [data, errors, included, links, meta]; }
	get [globalThis.Symbol.toStringTag]() { return "APIResponse"; }
	get data() { return this.#data; }
	get errors() { return this.#errors; }
	get included() { return this.#included; }
	get links() { return this.#links; }
	get meta() { return this.#meta; }
	addData(data) {
		if (typeof(this.#data) === "undefined")
			this.#data = data;
		else if (globalThis.Array.isArray(this.#data))
			this.#data.push(data);
		else {
			const oldData = this.#data;
			this.#data = [oldData, data];
		}
		return this;
	}
	addError(error) {
		if (typeof(this.#errors) === "undefined")
			this.#errors = [error];
		else
			this.#errors.push(error);
		return this;
	}
	addIncluded(included) {
		if (typeof(this.#included) === "undefined")
			this.#included = [included];
		else
			this.#included.push(included);
		return this;
	}
	addLink(link) {
		if (typeof(this.#links) === "undefined")
			this.#links = link;
		else
			globalThis.Object.assign(this.#links, link);
		return this;
	}
	addMeta(meta) {
		if (typeof(this.#meta) === "undefined")
			this.#meta = meta;
		else
			globalThis.Object.assign(this.#meta, meta);
		return this;
	}
	toJSON() { return { data: this.data, errors: this.errors, included: this.included, links: this.links, meta: this.meta }; }
	toString() { return globalThis.JSON.stringify(this); }
}