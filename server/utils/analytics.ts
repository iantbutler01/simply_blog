// Average reading speed (words per minute)
const WORDS_PER_MINUTE = 200;

// Calculate reading time in minutes for a block of content
export function calculateReadingTime(blocks: { type: string; content?: string }[]): number {
  const wordCount = blocks.reduce((total, block) => {
    if (block.type === 'text' && block.content) {
      // Strip HTML tags and count words
      const text = block.content.replace(/<[^>]*>/g, '');
      return total + text.trim().split(/\s+/).length;
    }
    // Add 10 seconds (1/6 minute) for each image
    if (block.type === 'image') {
      return total + (1/6 * WORDS_PER_MINUTE);
    }
    return total;
  }, 0);

  // Round up to the nearest minute
  return Math.ceil(wordCount / WORDS_PER_MINUTE);
}

// Increment social share count
export function incrementShareCount(currentCount: number): number {
  return currentCount + 1;
}
