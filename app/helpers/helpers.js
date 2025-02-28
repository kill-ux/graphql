/**
 * Creates an HTML element with the specified tag name, class name, and text content.
 *
 * @param {string} tagName - The HTML tag name for the element (e.g., "div", "span").
 * @param {string} [className=''] - The class or classes to add to the element.
 * @param {string} [textContent=''] - The text content for the element.
 * @returns {HTMLElement} The created and configured DOM element.
 */
export const createElement = (tagName, className = "", innerHTML = "") => {
  const element = document.createElement(tagName);
  element.className = className;
  element.innerHTML = innerHTML;
  return element;
}
