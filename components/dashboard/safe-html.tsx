"use client";

import DOMPurify from "dompurify";
import { useMemo } from "react";

/**
 * Renders admin-authored rich content (e.g. broadcast HTML) safely.
 * Everything is sanitized client-side with an allowlist — scripts, event
 * handlers and dangerous attributes are stripped before rendering.
 */
export function SafeHtml({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const clean = useMemo(
    () =>
      DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
          "a", "b", "strong", "i", "em", "u", "s", "br", "p", "div", "span",
          "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6",
          "img", "table", "thead", "tbody", "tr", "th", "td",
          "blockquote", "hr", "small", "sub", "sup",
        ],
        ALLOWED_ATTR: [
          "href", "src", "alt", "title", "target", "rel",
          "class", "width", "height", "colspan", "rowspan",
        ],
        FORBID_ATTR: ["style"],
      }),
    [html],
  );

  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}

/** True when the string looks like it contains HTML markup. */
export function looksLikeHtml(value: string | null | undefined): boolean {
  return Boolean(value && /<\/?[a-z][\s\S]*>/i.test(value));
}
