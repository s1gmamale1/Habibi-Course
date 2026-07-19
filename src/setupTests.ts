import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";

// localStorage polyfill for test environment - jsdom may not provide working clear()
beforeEach(() => {
  if (!localStorage.clear || typeof localStorage.clear !== "function") {
    const store: Record<string, string> = {};
    const localStorageMock = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => {
        for (const key in store) {
          delete store[key];
        }
      },
      key: (index: number) => Object.keys(store)[index] ?? null,
      get length() { return Object.keys(store).length; },
    };
    Object.defineProperty(globalThis, "localStorage", {
      value: localStorageMock,
      writable: true,
      configurable: true
    });
  }
});

afterEach(() => cleanup());
