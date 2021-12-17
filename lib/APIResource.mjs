export class APIResource {
	#id;
	#attributes;
	#links;
	#meta;
	#relationships;
	#type;

	constructor({ id, attributes, links, meta, relationships, type = "undefined" }) {
		[this.#id, this.#attributes, this.#links, this.#meta, this.#relationships, this.#type] = [id, attributes, links, meta, relationships, type];
	}
	get [globalThis.Symbol.toStringTag]() { return "APIResource"; }
	get id() { return this.#id; }
	get attributes() { return this.#attributes; }
	get links() { return this.#links; }
	get meta() { return this.#meta; }
	get relationships() { return this.#relationships; }
	get type() { return this.#type; }
	set id(id) { this.#id = id.toString(); }
	addAttribute(attribute) {
		if (typeof(this.#attributes) === "undefined")
			this.#attributes = attribute;
		else
			globalThis.Object.assign(this.#attributes, attribute);
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
	addRelationship(relationship) {
		if (typeof(this.#relationships) === "undefined")
			this.#relationships = relationship;
		else
			globalThis.Object.assign(this.#relationships, relationship);
		return this;
	}
	setId(id) {
		this.id = id;
		return this;
	}
	toJSON() { return { attributes: this.attributes, id: this.id, links: this.links, meta: this.meta, relationships: this.relationships, type: this.type }; }
	toString() { return globalThis.JSON.stringify(this); }
}