export function localizeBackToTop(): void {
  const content = document.querySelector<HTMLElement>(
    "[data-back-to-top-label]"
  );
  const button = document.querySelector<HTMLButtonElement>("#to-top-btn");
  const label = content?.dataset.backToTopLabel;

  if (button && label) button.setAttribute("aria-label", label);
}
