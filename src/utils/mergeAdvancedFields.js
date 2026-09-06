/**
 * Keep legacy frontmatter readable while the CMS groups optional fields.
 * @template {Record<string, unknown>} T
 * @param {T & { advanced?: Partial<T> | null }} data
 * @returns {Omit<T, "advanced">}
 */
export function mergeAdvancedFields(data) {
  const { advanced, ...fields } = data;
  return {
    ...fields,
    ...Object.fromEntries(
      Object.entries(advanced ?? {}).filter(([, value]) => value !== undefined)
    ),
  };
}
