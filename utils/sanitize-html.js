// helpers/sanitizeTiptap.js
const sanitizeHtml = require('sanitize-html')

function sanitizeTiptapHTML(html) {
	return sanitizeHtml(html, {
		allowedTags: [
			'h1',
			'h2',
			'h3',
			'h4',
			'h5',
			'h6',
			'blockquote',
			'p',
			'a',
			'ul',
			'ol',
			'li',
			'b',
			'i',
			'strong',
			'em',
			'u',
			's',
			'code',
			'pre',
			'span',
			'br',
			'hr',
		],
		allowedAttributes: {
			a: ['href', 'target', 'rel'],
			span: ['style'],
			'*': ['class'],
		},
		allowedSchemes: ['http', 'https', 'mailto'],
		allowedStyles: {
			span: {
				// Optional: allow inline styles from TipTap (like color)
				color: [/^.*$/],
				backgroundColor: [/^.*$/],
				textDecoration: [/^.*$/],
			},
		},
		transformTags: {
			a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }),
		},
		disallowedTagsMode: 'discard',
	})
}

module.exports = {
	sanitizeTiptapHTML,
}
