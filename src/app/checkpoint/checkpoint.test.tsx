import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import CheckpointPage from "./[id]/page";

describe("CheckpointPage", () => {
  test("renders rubric and revision map from real checkpoint-1", async () => {
    render(await CheckpointPage({ params: Promise.resolve({ id: "checkpoint-1" }) }));
    // getAllByText, not getByText: the real checkpoint-1 content legitimately mentions
    // "rubric"/"revision" in more than one place (the section heading AND the mandated
    // printable "Record results" step script), so a singular getByText would throw on
    // the ambiguity. We only need to confirm the sections render at all.
    expect(screen.getAllByText(/rubric/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/revision/i).length).toBeGreaterThan(0);
  });
});
