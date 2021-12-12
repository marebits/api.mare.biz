import { CachedItem } from "./CachedItem.mjs";

export class Cache {
	static #defaultGcTime = 10 * 60;
	static #defaultTtl = 5 * 60;

	#data = new globalThis.Map();
	#gcTime;
	#ttl;

	constructor(ttl = this.constructor.#defaultTtl, gcTime = this.constructor.#defaultGcTime) { [this.#ttl, this.#gcTime] = [ttl, gcTime]; }

	get [globalThis.Symbol.toStringTag]() { return "Cache"; }
	get gcTime() { return this.#gcTime; }
	get size() { return this.#data.size; }
	get ttl() { return this.#ttl; }

	#collectGarbage() {
		for (const entry of this.entries) { /* this space intentionally left blank */ }
		globalThis.setTimeout(this.#collectGarbage, this.gcTime * 1000);
	}

	[globalThis.Symbol.iterator]() { return this.entries; }
	[globalThis.Symbol.toPrimitive](hint) {
		if (hint === "number")
			return this.#data.size;
		return this.toString();
	}

	*entries() {
		const KEY = 0;
		const VALUE = 1;
		const entries = this.#data.entries();
		let entry = entries.next();

		while (!entry.done) {
			if (entry.value[VALUE].isExpired)
				this.delete(entry.value[KEY]);
			else
				yield [entry.value[KEY], entry.value[VALUE].value];
			entry = entries.next();
		}
	}
	*keys() {
		const KEY = 0;

		for (const entry of this)
			yield entry[KEY];
	}
	*values() {
		const VALUE = 1;

		for (const entry of this)
			yield entry[VALUE];
	}

	clear() { this.#data.clear(); }
	delete(key) { return this.#data.delete(key); }
	forEach(callbackFn, thisArg = undefined) {
		const KEY = 0;
		const VALUE = 1;

		for (const entry of this)
			callbackFn.call(thisArg, entry[VALUE].value, entry[KEY], this);
	}
	get(key) {
		const value = this.#data.get(key);

		if (typeof(value) === "undefined")
			return undefined;
		else if (value.isExpired) {
			this.delete(key);
			return undefined;
		}
		return this.#data.get(key).value;
	}
	has(key) {
		const value = this.#data.get(key);

		if (typeof(value) !== "undefined" && value.isExpired) {
			this.delete(key);
			return false;
		}
		return this.#data.has(key);
	}
	set(key, value, ttl = this.ttl) {
		this.#data.set(key, new CachedItem(value, ttl));
		return this;
	}
	toJSON() { return [...this.entries()]; }
	toString() { return globalThis.JSON.stringify(this); }
}