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

export type DeleteDirection = 'backward' | 'forward'

const DELETE_DIRECTIONS: Readonly<Record<string, DeleteDirection>> = {
  deleteContentBackward: 'backward',
  deleteContentForward: 'forward',
}

function findDigitBefore(text: string, caret: number): number {
  for (let index = caret - 1; index >= 0; index -= 1) {
    if (DIGIT_PATTERN.test(text[index])) return index
  }
  return -1
}

function findDigitFrom(text: string, caret: number): number {
  for (let index = caret; index < text.length; index += 1) {
    if (DIGIT_PATTERN.test(text[index])) return index
  }
  return -1
}

/**
 * A mask puts a separator back right after it was deleted (`3 |000` + Backspace gives `3 |000` again), so the user
 * seems stuck. When only a separator was removed, the digit next to the caret goes instead. `null` when there is none.
 */
export function deleteDigitBeside(text: string, caret: number, direction: DeleteDirection): { text: string; caret: number } | null {
  const index = direction === 'backward' ? findDigitBefore(text, caret) : findDigitFrom(text, caret)
  if (index < 0) return null
  return { text: text.slice(0, index) + text.slice(index + 1), caret: index }
}

interface MaskedEdit {
  /** The value as the browser has it after the keystroke. */
  value: string
  caret: number
  previousValue: string
  /** `InputEvent.inputType`, e.g. `deleteContentBackward`. */
  inputType: string
}

/** What the user meant by a keystroke in a masked field: the text to give the mask and the digits that stay right of the caret. */
export function readMaskedEdit({ value, caret, previousValue, inputType }: MaskedEdit): { text: string; digitsAfterCaret: number } {
  const direction = DELETE_DIRECTIONS[inputType]
  if (direction && countDigits(value) === countDigits(previousValue)) {
    const edit = deleteDigitBeside(value, caret, direction)
    if (edit) return { text: edit.text, digitsAfterCaret: countDigits(edit.text.slice(edit.caret)) }
  }
  return { text: value, digitsAfterCaret: countDigits(value.slice(caret)) }
}
