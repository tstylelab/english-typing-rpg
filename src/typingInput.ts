// Canonicalize matching English letters only. Wrong letters, punctuation and
// spaces must still reach the usual mistake checks unchanged.
export const alignTypingCase = (value: string, answer: string): string => (
  value.replace(/[A-Za-z]/g, (letter, index: number) => {
    const expected = answer[index] ?? '';
    return letter.toLowerCase() === expected.toLowerCase() ? expected : letter;
  })
);
