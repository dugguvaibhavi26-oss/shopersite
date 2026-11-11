import { describe, expect, it } from "vitest";
import { PAGE_SIZE, pageOf } from "@/components/dashboard/pager";

const items = Array.from({ length: 132 }, (_, i) => i + 1);

describe("pageOf", () => {
  it("shows 50 rows a page", () => {
    expect(PAGE_SIZE).toBe(50);
    const first = pageOf(items, 1);
    expect(first.rows).toHaveLength(50);
    expect(first.rows[0]).toBe(1);
    expect(first.pages).toBe(3);
  });

  it("gives the last page the leftover rows", () => {
    const last = pageOf(items, 3);
    expect(last.rows[0]).toBe(101);
    expect(last.rows).toHaveLength(32);
  });

  it("keeps the page inside its bounds", () => {
    expect(pageOf(items, 99).current).toBe(3);
    expect(pageOf(items, 0).current).toBe(1);
    expect(pageOf([], 4)).toMatchObject({ rows: [], current: 1, pages: 1 });
  });
});
