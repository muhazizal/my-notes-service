exports.pickAttributes = (payload, attributes) => {
	const result = {}
	attributes.forEach((attribute) => {
		if (Object.prototype.hasOwnProperty.call(payload, attribute)) {
			result[attribute] = payload[attribute]
		}
	})
	return result
}
