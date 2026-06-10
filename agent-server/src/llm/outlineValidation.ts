export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const VALID_CADENCES = new Set(['DAILY', 'WEEKLY']);

export function validateOutlinePayload(outline: any): ValidationResult {
  const errors: string[] = [];

  if (!outline || typeof outline !== 'object') {
    return { valid: false, errors: ['outline is missing or not an object'] };
  }

  if (!outline.why?.trim()) {
    errors.push('outline.why is required');
  }

  if (!Array.isArray(outline.phases) || outline.phases.length === 0) {
    errors.push('outline.phases must be a non-empty array');
    return { valid: false, errors };
  }

  if (outline.phases.length > 10) {
    errors.push(`outline has ${outline.phases.length} phases (max 10)`);
  }

  for (let i = 0; i < outline.phases.length; i++) {
    const phase = outline.phases[i];
    const prefix = `phases[${i}]`;

    if (!phase.purpose?.trim()) {
      errors.push(`${prefix}.purpose is required`);
    }

    const checklistItems  = Array.isArray(phase.checklist_items)  ? phase.checklist_items  : [];
    const habits          = Array.isArray(phase.habits)           ? phase.habits           : [];
    const checkInPrompts  = Array.isArray(phase.check_in_prompts) ? phase.check_in_prompts : [];
    const totalItems      = checklistItems.length + habits.length + checkInPrompts.length;

    if (totalItems === 0) {
      errors.push(`${prefix} has no items (needs at least one checklist item, habit, or check-in prompt)`);
    }
    if (totalItems > 15) {
      errors.push(`${prefix} has ${totalItems} items (max 15)`);
    }

    for (const habit of habits) {
      if (!VALID_CADENCES.has(habit.cadence)) {
        errors.push(`${prefix} habit cadence "${habit.cadence}" must be DAILY or WEEKLY`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
