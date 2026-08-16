import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { AliasesPanel } from "../../ui/src/components/AliasesPanel.js";
import { ALIASES_STORAGE_KEY, getLocalAliases } from "../../ui/src/hooks/useLocalAliases.js";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe("AliasesPanel", () => {
  it("initializes empty when no aliases are stored", () => {
    render(<AliasesPanel onClose={() => {}} />);
    const input = screen.getByLabelText("Comma-separated aliases") as HTMLInputElement;
    expect(input.value).toBe("");
  });

  it("initializes from existing stored aliases", () => {
    localStorage.setItem(ALIASES_STORAGE_KEY, JSON.stringify(["Maya Chen", "maya@example.com"]));
    render(<AliasesPanel onClose={() => {}} />);
    const input = screen.getByLabelText("Comma-separated aliases") as HTMLInputElement;
    expect(input.value).toBe("Maya Chen, maya@example.com");
  });

  it("saves a comma-separated list to localStorage, trimmed and without empties", () => {
    render(<AliasesPanel onClose={() => {}} />);
    const input = screen.getByLabelText("Comma-separated aliases");
    fireEvent.change(input, { target: { value: " Daniel Kim ,, daniel@example.com " } });
    fireEvent.click(screen.getByText("Save"));

    expect(getLocalAliases()).toEqual(["Daniel Kim", "daniel@example.com"]);
  });

  it("calls onClose when Escape is pressed", () => {
    let closed = false;
    render(<AliasesPanel onClose={() => (closed = true)} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(closed).toBe(true);
  });
});
