export class CachedItem {
	#value;
	#ttl = 0;
	#lastModified;

	constructor(value, ttl) { [this.value, this.#ttl] = [value, ttl]; }

	get [globalThis.Symbol.toStringTag]() { return "CachedItem"; }
	get isExpired() { return globalThis.Date.now() - this.lastModified > this.ttl * 1000; }
	get lastModified() { return this.#lastModified; }
	get ttl() { return this.#ttl; }
	get value() {
		if (this.isExpired)
			return undefined;
		return this.#value;
	}
	set value(value) { [this.#value, this.#lastModified] = [value, globalThis.Date.now()]; }

	toJSON() { return { value: this.#value, ttl: this.#ttl, lastModified: this.#lastModified }; }
	toString() { return globalThis.JSON.stringify(this); }
}