import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";

import { ErrorBoundary } from "../../ui/src/components/ErrorBoundary.js";

afterEach(() => {
  cleanup();
});

function Bomb(): never {
  throw new Error("kaboom");
}

describe("ErrorBoundary", () => {
  it("renders children normally when nothing throws", () => {
    render(
      <ErrorBoundary>
        <div>All good</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText("All good")).toBeDefined();
  });

  it("renders a fallback instead of crashing when a child throws", () => {
    // React logs the error to console during the render pass; suppress it
    // so the test output isn't cluttered with an expected stack trace.
    const originalError = console.error;
    console.error = () => {};
    try {
      render(
        <ErrorBoundary>
          <Bomb />
        </ErrorBoundary>,
      );
    } finally {
      console.error = originalError;
    }

    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByText("Something went wrong")).toBeDefined();
    expect(screen.getByText("kaboom")).toBeDefined();
  });
});
