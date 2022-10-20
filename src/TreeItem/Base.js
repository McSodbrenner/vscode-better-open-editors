module.exports = class Base {
	#contextValue = new Set();

	setContextValue(value) {
		this.#contextValue.clear();
		this.addContextValue(value);
	}

	addContextValue(value) {
		this.#contextValue.add(value.toString());
		this.#generateContextValue();
	}

	deleteContextValue(value) {
		this.#contextValue.delete(value);
		this.#generateContextValue();
	}

	hasContextValue(value) {
		return this.#contextValue.has(value);
	}

	#generateContextValue() {
		this.contextValue = '<' + Array.from(this.#contextValue).join('><') + '>';
	}
}