// Builds prompts using purpose/goals/context files

export class PromptBuilder {
  // TODO: Load context files

  buildAnalysisPrompt(data: string): string {
    // TODO: Build prompt for analysis
    return `Analyze the following data: ${data}`;
  }

  buildPlanPrompt(context: string): string {
    // TODO: Build prompt for plan generation
    return `Generate a plan based on: ${context}`;
  }
}
