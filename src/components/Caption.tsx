import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";

export const captionWordSchema = z.object({
	text: z.string(),
	start: z.number(), // seconds
	end: z.number(), // seconds
});

export type CaptionWord = z.infer<typeof captionWordSchema>;

export const captionSchema = z.object({
	words: z.array(captionWordSchema),
	className: z.string().optional(),
});

export type CaptionProps = z.infer<typeof captionSchema>;

export const Caption: React.FC<CaptionProps> = ({ words, className }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const currentTime = frame / fps;

	return (
		<div className="absolute bottom-8 left-0 right-0 flex justify-center px-8 z-50">
			<div
				className={`px-8 py-5 rounded-xl max-w-5xl bg-black/85 ${className ?? ""}`}
			>
				<p className="text-5xl font-semibold leading-tight text-center tracking-wide">
					{words.map((word, index) => {
						const isActive = currentTime >= word.start && currentTime < word.end;
						return (
							<span
								key={index}
								className={`transition-colors duration-150 ${isActive ? "text-white" : "text-white/70"}`}
							>
								{word.text}
								{index < words.length - 1 ? " " : ""}
							</span>
						);
					})}
				</p>
			</div>
		</div>
	);
};
