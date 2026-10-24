/** Joins the truthy class names; lets components switch classes with `condition && styles.name`. */
export function classNames(...names: ReadonlyArray<string | false | null | undefined>): string {
  return names.filter(Boolean).join(' ')
}
