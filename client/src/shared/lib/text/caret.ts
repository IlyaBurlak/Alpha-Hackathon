const DIGIT_PATTERN = /\d/

export function countDigits(text: string): number {
  return [...text].filter((char) => DIGIT_PATTERN.test(char)).length
}

/**
 * Caret position that leaves `digitsAfter` digits to its right. A masked value is rebuilt after every keystroke
 * (`2500` -> `2 500`, `9164` -> `+7 916 4`), so the caret is restored by the digits that follow it: counting from the
 * end is not confused by the characters the mask adds in front. It lands right after the preceding digit.
 */
export function findCaretWithDigitsAfter(text: string, digitsAfter: number): number {
  const digitsBefore = countDigits(text) - digitsAfter
  if (digitsBefore <= 0) return 0
  let seen = 0
  for (let index = 0; index < text.length; index += 1) {
    if (DIGIT_PATTERN.test(text[index])) seen += 1
    if (seen === digitsBefore) return index + 1
  }
  return text.length
}
