import type { SvgStyleOptions } from "../domain/types.ts";

const VIEWBOX_RE = /viewBox="([^"]+)"/;

const DEFAULTS: Required<SvgStyleOptions> = {
  background: "#ffffff",
  borderColor: "#cccccc",
  borderWidth: 1,
  borderRadius: 10,
  padding: 20,
};

/**
 * Parse a viewBox attribute value into numeric components.
 */
function parseViewBox(value: string): [number, number, number, number] | null {
  const parts = value.trim().split(/\s+/).map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return null;
  return parts as [number, number, number, number];
}

/**
 * Post-process an SVG string to add a background rect with rounded corners
 * and border, eliminating the need for HTML wrapper elements in Markdown.
 *
 * Returns the SVG unchanged if the viewBox attribute cannot be parsed.
 */
export function postProcessSvg(svg: string, options?: SvgStyleOptions): string {
  const match = VIEWBOX_RE.exec(svg);
  if (!match?.[1]) return svg;

  const parsed = parseViewBox(match[1]);
  if (!parsed) return svg;

  const bg = options?.background ?? DEFAULTS.background;
  const border = options?.borderColor ?? DEFAULTS.borderColor;
  const borderW = options?.borderWidth ?? DEFAULTS.borderWidth;
  const radius = options?.borderRadius ?? DEFAULTS.borderRadius;
  const pad = options?.padding ?? DEFAULTS.padding;

  const [minX, minY, width, height] = parsed;

  // Expand viewBox by padding on each side
  const newMinX = minX - pad;
  const newMinY = minY - pad;
  const newWidth = width + pad * 2;
  const newHeight = height + pad * 2;
  const newViewBox = `${newMinX} ${newMinY} ${newWidth} ${newHeight}`;

  // Background rect fills the full expanded viewBox
  const bgRect = [
    `<rect x="${newMinX}" y="${newMinY}"`,
    ` width="${newWidth}" height="${newHeight}"`,
    ` rx="${radius}" ry="${radius}"`,
    ` fill="${bg}"`,
    ` stroke="${border}" stroke-width="${borderW}"/>`,
  ].join("");

  // Replace viewBox in the opening <svg> tag
  const result = svg.replace(VIEWBOX_RE, `viewBox="${newViewBox}"`);

  // Find the end of the opening <svg> tag to insert after it
  const svgTagEnd = result.indexOf(">") + 1;
  if (svgTagEnd <= 0) return svg;

  const before = result.slice(0, svgTagEnd);
  const after = result.slice(svgTagEnd);

  // Find the closing </svg> to wrap inner content in a translated group
  const closingIdx = after.lastIndexOf("</svg>");
  if (closingIdx < 0) return svg;

  const innerContent = after.slice(0, closingIdx);
  const closing = after.slice(closingIdx);

  return `${before}${bgRect}<g transform="translate(0,0)">${innerContent}</g>${closing}`;
}
