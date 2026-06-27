import React from "react";
import { AbsoluteFill, Img, staticFile, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";

export const logoSchema = z.object({
	src: z.string(),
	alt: z.string().optional().default("Logo"),
	position: z.enum(["left", "right"]).optional().default("right"),
	size: z.number().optional().default(220),
});

export type LogoProps = z.infer<typeof logoSchema>;

export const Logo: React.FC<LogoProps> = ({
	src,
	alt = "Logo",
	position = "right",
	size = 220,
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	// Spring fade-in animation
	const opacity = spring({
		frame,
		fps,
		config: {
			damping: 200,
		},
	});

	// Bouncy scale animation on entrance - starts large and bounces to final size
	const scale = spring({
		frame,
		fps,
		from: 2.2,
		to: 1,
		config: {
			damping: 12,
			mass: 0.5,
			stiffness: 100,
		},
	});

	// Position based on left/right prop
	const positionStyle =
		position === "left"
			? {
					left: "20%",
					top: "20%",
			  }
			: {
					right: "20%",
					top: "20%",
			  };

	return (
		<AbsoluteFill style={{ pointerEvents: "none" }}>
			<div
				style={{
					position: "absolute",
					...positionStyle,
					opacity,
					transform: `scale(${scale})`,
					width: size,
					height: size,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<Img src={staticFile(src)} alt={alt} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
			</div>
		</AbsoluteFill>
	);
};
