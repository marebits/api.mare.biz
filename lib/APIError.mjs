export class APIError {
	#id;
	#code;
	#detail;
	#links;
	#meta;
	#source;
	#status;
	#title;

	constructor({ id, code, detail, links, meta, source, status, title } = {}) {
		[this.#id, this.#code, this.#detail, this.#links, this.#meta, this.#source, this.#status, this.#title] = [id, code, detail, links, meta, source, status, title];
	}
	get [globalThis.Symbol.toStringTag]() { return "APIError"; }
	get id() { return this.#id; }
	get code() { return this.#code; }
	get detail() { return this.#detail; }
	get links() { return this.#links; }
	get meta() { return this.#meta; }
	get source() { return this.#source; }
	get status() { return this.#status; }
	get title() { return this.#title; }
	set id(id) { this.#id = id.toString(); }
	set code(code) { this.#code = code.toString(); }
	set detail(detail) { this.#detail = detail.toString(); }
	set status(status) { this.#status = status.toString(); }
	set title(title) { this.#title = title.toString(); }
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
	addSource(source) {
		if (typeof(this.#source) === "undefined")
			this.#source = source;
		else
			globalThis.Object.assign(this.#source, source);
	}
	setId(id) {
		this.id = id;
		return this;
	}
	setCode(code) {
		this.code = code;
		return this;
	}
	setDetail(detail) {
		this.detail = detail;
		return this;
	}
	setStatus(status) {
		this.status = status;
		return this;
	}
	setTitle(title) {
		this.title = title;
		return this;
	}
	toJSON() { return { id: this.id, code: this.code, detail: this.detail, links: this.links, meta: this.meta, source: this.source, status: this.status, title: this.title }; }
	toString() { return globalThis.JSON.stringify(this); }
}