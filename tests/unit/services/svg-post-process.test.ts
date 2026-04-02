import { describe, expect, test } from "bun:test";
import { postProcessSvg } from "../../../src/services/svg-post-process.ts";

const MINIMAL_SVG = '<svg viewBox="0 0 100 50"><rect width="100" height="50"/></svg>';

const MMDC_SVG =
  '<svg id="my-svg" width="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 653px; background-color: white;" viewBox="0 -70 653 1028"><style>#my-svg{font-family:sans-serif;}</style><g><rect x="10" y="10" width="80" height="30"/></g></svg>';

describe("postProcessSvg", () => {
  test("inserts background rect with rounded corners", () => {
    const result = postProcessSvg(MINIMAL_SVG);
    expect(result).toContain('<rect x="-20" y="-20"');
    expect(result).toContain('rx="10"');
    expect(result).toContain('ry="10"');
    expect(result).toContain('fill="#ffffff"');
  });

  test("inserts border stroke on background rect", () => {
    const result = postProcessSvg(MINIMAL_SVG);
    expect(result).toContain('stroke="#cccccc"');
    expect(result).toContain('stroke-width="1"');
  });

  test("expands viewBox by padding", () => {
    // Original viewBox="0 0 100 50", padding=20 → viewBox="-20 -20 140 90"
    const result = postProcessSvg(MINIMAL_SVG);
    expect(result).toContain('viewBox="-20 -20 140 90"');
  });

  test("wraps existing content in translated group", () => {
    const result = postProcessSvg(MINIMAL_SVG);
    expect(result).toContain('<g transform="translate(0,0)">');
  });

  test("background rect covers full expanded viewBox", () => {
    const result = postProcessSvg(MINIMAL_SVG);
    // The background rect should fill the expanded viewBox
    expect(result).toContain('width="140"');
    expect(result).toContain('height="90"');
  });

  test("handles negative viewBox origin", () => {
    // mmdc output often has negative y origin: viewBox="0 -70 653 1028"
    const result = postProcessSvg(MMDC_SVG);
    // Padding expands: viewBox="-20 -90 693 1068"
    expect(result).toContain('viewBox="-20 -90 693 1068"');
  });

  test("uses custom options", () => {
    const result = postProcessSvg(MINIMAL_SVG, {
      background: "#f0f0f0",
      borderColor: "#999999",
      borderWidth: 2,
      borderRadius: 5,
      padding: 10,
    });
    expect(result).toContain('fill="#f0f0f0"');
    expect(result).toContain('stroke="#999999"');
    expect(result).toContain('stroke-width="2"');
    expect(result).toContain('rx="5"');
    expect(result).toContain('viewBox="-10 -10 120 70"');
  });

  test("uses defaults when no options provided", () => {
    const result = postProcessSvg(MINIMAL_SVG);
    expect(result).toContain('fill="#ffffff"');
    expect(result).toContain('stroke="#cccccc"');
    expect(result).toContain('stroke-width="1"');
    expect(result).toContain('rx="10"');
  });

  test("preserves existing SVG content", () => {
    const result = postProcessSvg(MINIMAL_SVG);
    expect(result).toContain('<rect width="100" height="50"/>');
  });

  test("preserves SVG attributes other than viewBox", () => {
    const result = postProcessSvg(MMDC_SVG);
    expect(result).toContain('id="my-svg"');
    expect(result).toContain('width="100%"');
    expect(result).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  test("handles SVG without viewBox gracefully", () => {
    const noViewBox = '<svg width="100" height="50"><circle r="10"/></svg>';
    const result = postProcessSvg(noViewBox);
    // Should return the SVG unchanged when viewBox cannot be parsed
    expect(result).toBe(noViewBox);
  });

  test("disables post-processing with zero padding and no border", () => {
    const result = postProcessSvg(MINIMAL_SVG, {
      padding: 0,
      borderWidth: 0,
      borderRadius: 0,
    });
    // Even with zero padding, background rect should be inserted for the background color
    expect(result).toContain('fill="#ffffff"');
    expect(result).toContain('viewBox="0 0 100 50"');
  });
});
