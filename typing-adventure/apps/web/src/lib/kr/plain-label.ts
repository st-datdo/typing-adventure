export function plainLabel(label: string): string {
  return label.replace(/^[^\p{L}\p{N}]+/u, '')
}
