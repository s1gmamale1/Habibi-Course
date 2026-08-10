import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IsolateControl } from "./IsolateControl";

describe("IsolateControl", () => {
  it("renders a toggle per rule plus All", () => {
    render(<IsolateControl rules={["ikhfa", "qalqalah"]} value={null} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /all/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /ikhfāʾ/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /qalqalah/i })).toBeTruthy();
  });

  it("resets isolation when All is chosen", async () => {
    const onChange = vi.fn();
    render(<IsolateControl rules={["ikhfa"]} value="ikhfa" onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /all/i }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("selects a rule when its toggle is clicked", async () => {
    const onChange = vi.fn();
    render(<IsolateControl rules={["ikhfa"]} value={null} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /ikhfāʾ/i }));
    expect(onChange).toHaveBeenCalledWith("ikhfa");
  });

  it("clears isolation when the active rule is clicked again", async () => {
    const onChange = vi.fn();
    render(<IsolateControl rules={["ikhfa"]} value="ikhfa" onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /ikhfāʾ/i }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("marks the active rule with aria-pressed", () => {
    render(<IsolateControl rules={["ikhfa"]} value="ikhfa" onChange={() => {}} />);
    const btn = screen.getByRole("button", { name: /ikhfāʾ/i });
    expect(btn.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: /all/i }).getAttribute("aria-pressed")).toBe("false");
  });

  it("marks All as pressed when nothing is isolated", () => {
    render(<IsolateControl rules={["ikhfa"]} value={null} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /all/i }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: /ikhfāʾ/i }).getAttribute("aria-pressed")).toBe("false");
  });

  it("uses real buttons, not styled divs", () => {
    const { container } = render(
      <IsolateControl rules={["ikhfa", "qalqalah"]} value={null} onChange={() => {}} />,
    );
    expect(container.querySelectorAll("button").length).toBe(3);
  });

  it("renders one toggle per unique rule, in the order given", () => {
    const { container } = render(
      <IsolateControl rules={["qalqalah", "ikhfa", "qalqalah"]} value={null} onChange={() => {}} />,
    );
    const rules = [...container.querySelectorAll("[data-rule]")].map((el) =>
      el.getAttribute("data-rule"),
    );
    expect(rules).toEqual(["qalqalah", "ikhfa"]);
  });

  it("renders nothing when there are no rules", () => {
    const { container } = render(<IsolateControl rules={[]} value={null} onChange={() => {}} />);
    expect(container.innerHTML).toBe("");
  });
});
