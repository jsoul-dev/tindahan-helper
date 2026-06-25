export const UNCATEGORIZED_CATEGORY = 'Uncategorized';
export const NO_CATEGORY_LABEL = '* No Category';
export const NO_CATEGORY_OPTION_LABEL = `${NO_CATEGORY_LABEL} (Uncategorized)`;

export function formatCategoryLabel(category: string | null | undefined) {
  return !category || category === UNCATEGORIZED_CATEGORY ? NO_CATEGORY_LABEL : category;
}
