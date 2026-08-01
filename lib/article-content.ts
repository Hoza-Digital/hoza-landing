export function articleContentToPlainText(content: string) {
  return content
    .replace(/!\[([^\]]*)]\((?:[^)]+)\)/g, "$1")
    .replace(/\[([^\]]+)]\((?:[^)]+)\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^(?:[-*>]|\d+\.)\s+/gm, "")
    .replace(/[*_~`]/g, "")
    .replace(/\\([\\*_[\]()#+.!>-])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}
