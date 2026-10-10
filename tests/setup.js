import React from 'react';
import '@testing-library/jest-dom';
import { beforeEach } from 'vitest';

globalThis.React = React;

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

beforeEach(() => {
  if (typeof window !== 'undefined') {
    window.localStorage?.clear();
    window.sessionStorage?.clear();
  }
});

