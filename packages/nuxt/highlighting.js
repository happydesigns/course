/** Keep template punctuation out of the language grammar while preserving offsets.
 * Intended for Course parameters inside identifiers, literals and numeric values.
 * Restore the original template before rendering so interpolation/copy stay exact.
 * @returns {import("shiki").ShikiTransformer}
 */
export function courseInputHighlighting() {
  /** @type {WeakMap<object, string>} */
  const sources = new WeakMap();
  return {
    name: "course-input-placeholders",
    preprocess(code) {
      sources.set(this.meta, code);
      return code.replace(/\{\{\s*\$doc\.input\.[A-Za-z][A-Za-z0-9_.-]*\s*\}\}/g,
        placeholder => placeholder.replace(/[^\r\n]/g, "0"));
    },
    tokens(lines) {
      const source = sources.get(this.meta);
      if (source === undefined) return;
      for (const line of lines) for (const token of line) {
        token.content = source.slice(token.offset, token.offset + token.content.length);
      }
    }
  };
}
