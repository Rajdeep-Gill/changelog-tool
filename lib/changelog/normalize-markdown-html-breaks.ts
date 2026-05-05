/**
 * Many tools emit HTML line breaks inside markdown. CommonMark / react-markdown
 * show those tags as literal text unless you allow raw HTML. GFM hard breaks
 * (`  \n`) render as line breaks without raw HTML.
 */
export function normalizeMarkdownHtmlBreaks(markdown: string): string {
  return markdown.replace(/<br\s*\/?>/gi, "  \n")
}
