import type { CaptionWord } from "../components/Caption";

export interface CaptionSegment {
	id: number;
	startTime: number; // seconds
	endTime: number; // seconds
	words: CaptionWord[];
}

export interface SegmentationConfig {
	minWords: number; // Never fewer than this per segment
	targetWords: number; // Ideal segment size - break on commas at or after this
	maxWords: number; // Force break at this count even without punctuation
	sentenceEnders: string[]; // Always break here if >= minWords
	phraseBreaks: string[]; // Break here if >= targetWords
}

export interface SegmentationOptions {
	config?: Partial<SegmentationConfig>;
	forceBreakAfter?: number[]; // Word indices to force breaks after
	preventBreakAfter?: number[]; // Word indices to prevent breaks after
}

// Default configuration
const DEFAULT_CONFIG: SegmentationConfig = {
	minWords: 4,
	targetWords: 8,
	maxWords: 12,
	sentenceEnders: [".", "!", "?"],
	phraseBreaks: [","],
};

function hasPunctuation(word: string, punctuation: string[]): boolean {
	return punctuation.some((p) => word.endsWith(p));
}

export interface TranscriptWord {
	word: string;
	start: number;
	end: number;
	confidence: number;
	punctuated_word: string;
}

/**
 * Segments a transcript into caption segments with intelligent break points.
 *
 * Breaks are determined by:
 * 1. Sentence endings (., !, ?) when we have >= minWords
 * 2. Phrase breaks (,) when we have >= targetWords
 * 3. Force break at maxWords even without punctuation
 *
 * @param words - Array of transcript words with timing data
 * @param options - Optional configuration and manual overrides
 * @returns Array of caption segments
 */
export function segmentTranscript(
	words: TranscriptWord[],
	options: SegmentationOptions = {},
): CaptionSegment[] {
	const config = { ...DEFAULT_CONFIG, ...options.config };
	const forceBreakAfter = options.forceBreakAfter ?? [];
	const preventBreakAfter = options.preventBreakAfter ?? [];

	const segments: CaptionSegment[] = [];
	let currentSegment: CaptionWord[] = [];
	let segmentId = 0;

	for (let i = 0; i < words.length; i++) {
		const word = words[i];
		const punctuatedWord = word.punctuated_word;

		currentSegment.push({
			text: punctuatedWord,
			start: word.start,
			end: word.end,
		});

		const wordCount = currentSegment.length;
		const isLastWord = i === words.length - 1;
		const isForcedBreak = forceBreakAfter.includes(i);
		const isPreventedBreak = preventBreakAfter.includes(i);

		// Determine if we should break here
		let shouldBreak = false;

		if (isForcedBreak && !isPreventedBreak) {
			shouldBreak = true;
		} else if (!isPreventedBreak) {
			const isSentenceEnd = hasPunctuation(punctuatedWord, config.sentenceEnders);
			const isPhraseBreak = hasPunctuation(punctuatedWord, config.phraseBreaks);

			if (isSentenceEnd && wordCount >= config.minWords) {
				// Always break on sentence end if we have enough words
				shouldBreak = true;
			} else if (isPhraseBreak && wordCount >= config.targetWords) {
				// Break on comma if we're at or past target
				shouldBreak = true;
			} else if (wordCount >= config.maxWords) {
				// Force break at max, even without punctuation
				shouldBreak = true;
			}
		}

		if (isLastWord) {
			shouldBreak = true; // Always break on last word
		}

		if (shouldBreak && currentSegment.length > 0) {
			segments.push({
				id: segmentId++,
				startTime: currentSegment[0].start,
				endTime: currentSegment[currentSegment.length - 1].end,
				words: [...currentSegment],
			});
			currentSegment = [];
		}
	}

	return segments;
}
