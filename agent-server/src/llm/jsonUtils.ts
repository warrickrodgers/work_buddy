/**
 * Strip markdown code fences and extract the first JSON object from an LLM response.
 * Shared by both the analysis path and the outline parsing path.
 */
export function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();

  cleaned = cleaned.replace(/```json\s*\n/g, '');
  cleaned = cleaned.replace(/```\s*\n/g, '');
  cleaned = cleaned.replace(/\n```$/g, '');
  cleaned = cleaned.replace(/```$/g, '');

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  return cleaned.trim();
}
