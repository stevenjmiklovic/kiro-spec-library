import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, render, screen, waitFor, fireEvent } from "@testing-library/react";

import { CrewProvider, type CrewIntegration } from "../../ui/src/hooks/useCrewIntegration.js";
import { AuditLogPanel } from "../../ui/src/components/AuditLogPanel.js";

afterEach(() => {
  cleanup();
});

const SAMPLE_EVENTS = [
  {
    id: "audit-1",
    operation: "metadata_updated",
    spec_key: "retention",
    snapshot_id: null,
    actor: "Maya Chen",
    timestamp: "2026-08-15T09:12:00Z",
  },
  {
    id: "audit-2",
    operation: "snapshot_created",
    spec_key: "workspace-index",
    snapshot_id: "snap-workspace",
    actor: "system",
    timestamp: "2026-08-07T10:14:00Z",
  },
];

function makeProvider(events = SAMPLE_EVENTS): {
  overrides: Partial<CrewIntegration>;
  getLastUrl: () => string | undefined;
} {
  let lastUrl: string | undefined;
  const overrides: Partial<CrewIntegration> = {
    api: {
      async fetch(path: string) {
        lastUrl = path;
        const params = new URLSearchParams(path.split("?")[1] ?? "");
        const operation = params.get("operation");
        const filtered = events.filter((e) => !operation || e.operation === operation);
        return new Response(JSON.stringify({ events: filtered, total: filtered.length }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  };
  return { overrides, getLastUrl: () => lastUrl };
}

describe("AuditLogPanel", () => {
  it("loads and renders audit events", async () => {
    const { overrides } = makeProvider();
    render(
      <CrewProvider overrides={overrides}>
        <AuditLogPanel onClose={() => {}} />
      </CrewProvider>,
    );

    await waitFor(() => expect(screen.getByText("Maya Chen")).toBeDefined());
    expect(screen.getByText("workspace-index")).toBeDefined();
    // "metadata updated" also appears as a <select> option label, so assert
    // via the table cell specifically rather than getByText (ambiguous).
    const row = screen.getByText("Maya Chen").closest("tr");
    expect(row?.textContent).toContain("metadata updated");
  });

  it("refetches with the operation filter when changed", async () => {
    const { overrides, getLastUrl } = makeProvider();
    render(
      <CrewProvider overrides={overrides}>
        <AuditLogPanel onClose={() => {}} />
      </CrewProvider>,
    );

    await waitFor(() => expect(screen.getByText("Maya Chen")).toBeDefined());

    fireEvent.change(screen.getByLabelText("Filter by operation"), {
      target: { value: "snapshot_created" },
    });

    await waitFor(() => expect(getLastUrl()).toContain("operation=snapshot_created"));
    await waitFor(() => expect(screen.queryByText("Maya Chen")).toBeNull());
    expect(screen.getByText("workspace-index")).toBeDefined();
  });

  it("shows an error message when the request fails", async () => {
    const overrides: Partial<CrewIntegration> = {
      api: {
        async fetch() {
          return new Response(JSON.stringify({ code: "INTERNAL_ERROR" }), { status: 500 });
        },
      },
    };
    render(
      <CrewProvider overrides={overrides}>
        <AuditLogPanel onClose={() => {}} />
      </CrewProvider>,
    );

    await waitFor(() => expect(screen.getByRole("alert")).toBeDefined());
  });

  it("calls onClose when Escape is pressed", () => {
    const { overrides } = makeProvider();
    let closed = false;
    render(
      <CrewProvider overrides={overrides}>
        <AuditLogPanel onClose={() => (closed = true)} />
      </CrewProvider>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(closed).toBe(true);
  });
});
