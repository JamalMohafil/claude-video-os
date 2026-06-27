import { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { z } from "zod";

export const diagramSchema = z.object({
	type: z.enum(["mermaid", "d2"]),
	diagram: z.string(),
	theme: z.enum(["default", "dark", "forest", "neutral"]).optional(),
	sketch: z.boolean().optional(),
	backgroundColor: z.string().optional(), // Set to 'transparent' or a color
});

type DiagramProps = z.infer<typeof diagramSchema>;

export const Diagram: React.FC<DiagramProps> = ({
	type,
	diagram,
	theme = "default",
	sketch = false,
	backgroundColor,
}) => {
	const [svg, setSvg] = useState<string | null>(null);
	const [handle] = useState(() => delayRender("Rendering diagram"));

	useEffect(() => {
		let cancelled = false;

		const renderDiagram = async () => {
			try {
				let renderedSvg: string;

				if (type === "mermaid") {
					// Render Mermaid diagram
					const mermaid = (await import("mermaid")).default;
					mermaid.initialize({
						startOnLoad: false,
						theme,
					});

					const { svg: mermaidSvg } = await mermaid.render(
						`mermaid-${Date.now()}`,
						diagram,
					);
					renderedSvg = mermaidSvg;
				} else {
					// Render D2 diagram
					const { D2 } = await import("@terrastruct/d2");
					const d2 = new D2();
					const result = await d2.compile(diagram, { options: {} });
					renderedSvg = await d2.render(result.diagram, {
						...result.renderOptions,
						pad: 0,
						sketch,
					});
				}

				// Make SVG responsive
				const parser = new DOMParser();
				const doc = parser.parseFromString(renderedSvg, "image/svg+xml");
				const svgElement = doc.querySelector("svg");

				if (svgElement) {
					// Get original dimensions
					const width = svgElement.getAttribute("width");
					const height = svgElement.getAttribute("height");

					// Add viewBox if it doesn't exist
					if (!svgElement.hasAttribute("viewBox") && width && height) {
						svgElement.setAttribute("viewBox", `0 0 ${width} ${height}`);
					}

					// Remove fixed width and height
					svgElement.removeAttribute("width");
					svgElement.removeAttribute("height");

					// Set preserveAspectRatio
					svgElement.setAttribute("preserveAspectRatio", "xMidYMid meet");

					// Handle background color - find and modify any rect with class="background" or the first rect
					if (backgroundColor) {
						const backgroundRect = svgElement.querySelector('rect.background') ||
							svgElement.querySelector('rect:first-of-type');
						if (backgroundRect && backgroundColor === 'transparent') {
							backgroundRect.remove();
						} else if (backgroundRect) {
							backgroundRect.setAttribute('fill', backgroundColor);
						}
					}

					// Add responsive styling
					svgElement.setAttribute(
						"style",
						"max-width: 100%; max-height: 100%; width: auto; height: auto;",
					);

					if (!cancelled) {
						const modifiedSvg = new XMLSerializer().serializeToString(doc);
						setSvg(modifiedSvg);
						continueRender(handle);
					}
				}
			} catch (error) {
				console.error(`Error rendering ${type} diagram:`, error);
				if (!cancelled) {
					continueRender(handle);
				}
			}
		};

		renderDiagram();

		return () => {
			cancelled = true;
		};
	}, [diagram, type, theme, sketch, backgroundColor, handle]);

	if (!svg) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<div className="text-gray-500">Loading diagram...</div>
			</div>
		);
	}

	return (
		<div
			className="w-full h-full flex items-center justify-center"
			dangerouslySetInnerHTML={{ __html: svg }}
		/>
	);
};
