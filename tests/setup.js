import '@testing-library/jest-dom';

// Ensure SVG element focus is supported in jsdom
if (typeof SVGElement !== 'undefined' && !SVGElement.prototype.focus) {
  SVGElement.prototype.focus = function () {
    if (document.activeElement !== this) {
      Object.defineProperty(document, 'activeElement', {
        value: this,
        writable: true,
        configurable: true,
      });
    }
  };
}
