const { sanitizeTiptapHTML } = require('../../../utils/sanitize-html')

describe('utils/sanitize-html', () => {
	test('removes disallowed tags like <script> and preserves allowed content', () => {
		const dirty = '<h1>Hello</h1><script>alert(1)</script><p>World</p>'
		const clean = sanitizeTiptapHTML(dirty)
		expect(clean).toContain('<h1>Hello</h1>')
		expect(clean).toContain('<p>World</p>')
		expect(clean).not.toContain('<script>')
	})

	test('adds rel and target to anchor tags as configured', () => {
		const dirty = '<a href="https://example.com">link</a>'
		const clean = sanitizeTiptapHTML(dirty)
		expect(clean).toContain('rel="noopener noreferrer"')
		expect(clean).toContain('target="_blank"')
	})
})
