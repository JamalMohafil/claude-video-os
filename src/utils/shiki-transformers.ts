import type { ShikiTransformer } from "shiki";

/**
 * Custom Shiki transformer that highlights lines based on a range string.
 * This transformer adds:
 * - `highlighted` class to specified lines
 * - `has-highlighted` class to the <pre> element
 *
 * Unlike the built-in transformerMetaHighlight which only adds line classes,
 * this transformer also adds the has-highlighted class to enable dim effect.
 *
 * @param highlightLines - Range string like "7-10,14-15" or "{7-10,14-15}"
 * @returns Shiki transformer object
 */
export function createLineHighlightTransformer(highlightLines: string): ShikiTransformer {
	const linesToHighlight = parseLineRanges(highlightLines);

	return {
		name: "custom-line-highlight",
		line(node, lineNumber) {
			if (linesToHighlight.includes(lineNumber)) {
				this.addClassToHast(node, "highlighted");
			}
		},
		pre(node) {
			if (linesToHighlight.length > 0) {
				this.addClassToHast(node, "has-highlighted");
			}
		},
	};
}

/**
 * Parse a line range string into an array of line numbers.
 *
 * @param metaString - Range string like "7-10,14-15" or "{7-10,14-15}"
 * @returns Array of line numbers
 *
 * @example
 * parseLineRanges("{7-10,14-15}") // [7, 8, 9, 10, 14, 15]
 * parseLineRanges("1,3,5-7") // [1, 3, 5, 6, 7]
 */
function parseLineRanges(metaString: string): number[] {
	const lines: number[] = [];

	// Remove curly braces if present
	const clean = metaString.replace(/[{}]/g, "").trim();

	if (!clean) return lines;

	// Split by comma
	const parts = clean.split(",");

	for (const part of parts) {
		const trimmed = part.trim();
		if (!trimmed) continue;

		if (trimmed.includes("-")) {
			// Range like "7-10"
			const [start, end] = trimmed.split("-").map((n) => parseInt(n.trim(), 10));
			if (!isNaN(start) && !isNaN(end)) {
				for (let i = start; i <= end; i++) {
					lines.push(i);
				}
			}
		} else {
			// Single line like "5"
			const lineNum = parseInt(trimmed, 10);
			if (!isNaN(lineNum)) {
				lines.push(lineNum);
			}
		}
	}

	return lines;
}
