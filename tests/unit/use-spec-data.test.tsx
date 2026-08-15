import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, render, waitFor } from "@testing-library/react";
import { useEffect, useState, type ReactElement } from "react";

import { CrewProvider, type CrewIntegration } from "../../ui/src/hooks/useCrewIntegration.js";
import { buildSpecsQuery, useSpecData } from "../../ui/src/hooks/useSpecData.js";

afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// buildSpecsQuery — value-derived, identity-independent key (the fix's contract)
// ---------------------------------------------------------------------------

describe("buildSpecsQuery", () => {
  it("returns an identical string for equal filter VALUES regardless of object identity", () => {
    const a = buildSpecsQuery({ filters: { type: "feature", stage: "design" }, limit: 500 });
    const b = buildSpecsQuery({ filters: { type: "feature", stage: "design" }, limit: 500 });
    expect(a).toBe(b);
  });

  it("is insensitive to filter key ordering", () => {
    const a = buildSpecsQuery({ filters: { stage: "design", type: "feature" } });
    const b = buildSpecsQuery({ filters: { type: "feature", stage: "design" } });
    expect(a).toBe(b);
  });

  it("changes when a filter value changes", () => {
    const a = buildSpecsQuery({ filters: { type: "feature" } });
    const b = buildSpecsQuery({ filters: { type: "bugfix" } });
    expect(a).not.toBe(b);
  });
});

// ---------------------------------------------------------------------------
// useSpecData — must NOT refetch on parent re-renders that pass a fresh
// `filters` object literal with identical values (regression: infinite loop
// that kept "Loading specifications…" flickering).
// ---------------------------------------------------------------------------

describe("useSpecData fetch-loop regression", () => {
  function makeCountingProvider(): {
    overrides: Partial<CrewIntegration>;
    getCount: () => number;
  } {
    let fetchCount = 0;
    const overrides: Partial<CrewIntegration> = {
      api: {
        async fetch() {
          fetchCount += 1;
          return new Response(JSON.stringify({ specs: [], total: 0 }), {
            headers: { "Content-Type": "application/json" },
          });
        },
      },
    };
    return { overrides, getCount: () => fetchCount };
  }

  it("fetches once across repeated re-renders with new-but-equal filter objects", async () => {
    const { overrides, getCount } = makeCountingProvider();

    // A component that force-re-renders itself several times, each time
    // rebuilding a FRESH filters object literal with identical values —
    // exactly the pattern RelationshipView used that triggered the loop.
    function Harness(): ReactElement {
      const [tick, setTick] = useState(0);

      useSpecData({
        filters: { type: "feature", stage: undefined, owner: undefined, repository: undefined },
        limit: 500,
      });

      useEffect(() => {
        if (tick < 5) {
          const id = setTimeout(() => setTick((t) => t + 1), 5);
          return () => clearTimeout(id);
        }
        return undefined;
      }, [tick]);

      return <div data-testid="tick">{tick}</div>;
    }

    render(
      <CrewProvider overrides={overrides}>
        <Harness />
      </CrewProvider>,
    );

    // Wait until the harness has re-rendered its full sequence.
    await waitFor(() => {
      expect(document.querySelector('[data-testid="tick"]')?.textContent).toBe("5");
    });

    // Give any errant loop a chance to pile up extra fetches.
    await new Promise((r) => setTimeout(r, 60));

    // Exactly one fetch: the initial load. A regressed hook keyed on the
    // filters object identity would fire on every render (>= 6).
    expect(getCount()).toBe(1);
  });

  it("refetches exactly once more when a filter value actually changes", async () => {
    const { overrides, getCount } = makeCountingProvider();

    function Harness(): ReactElement {
      const [type, setType] = useState("feature");

      useSpecData({ filters: { type }, limit: 500 });

      useEffect(() => {
        const id = setTimeout(() => setType("bugfix"), 10);
        return () => clearTimeout(id);
      }, []);

      return <div data-testid="type">{type}</div>;
    }

    render(
      <CrewProvider overrides={overrides}>
        <Harness />
      </CrewProvider>,
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="type"]')?.textContent).toBe("bugfix");
    });
    await new Promise((r) => setTimeout(r, 60));

    // One initial fetch + one for the changed value = 2.
    expect(getCount()).toBe(2);
  });
});
