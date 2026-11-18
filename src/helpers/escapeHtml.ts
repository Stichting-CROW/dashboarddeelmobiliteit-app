const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&#039;',
};

/**
 * Escapes a value for safe interpolation into an HTML string, both as text
 * content and inside quoted attribute values. Use this for every dynamic value
 * passed to `innerHTML`, maplibre's `Popup.setHTML` or `dangerouslySetInnerHTML`.
 */
export const escapeHtml = (value: unknown): string => {
  return String(value ?? '').replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
};

export default escapeHtml;
