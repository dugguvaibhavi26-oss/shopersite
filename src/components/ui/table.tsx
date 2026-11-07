import * as React from "react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

export interface ResponsiveTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyState?: React.ReactNode;
  className?: string;
}

export function ResponsiveTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyState,
  className,
}: ResponsiveTableProps<T>) {
  if (data.length === 0 && emptyState) {
    return <div className="p-8 text-center">{emptyState}</div>;
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop & Tablet Table (Hidden below sm: 640px) */}
      <div className="hidden sm:block overflow-x-auto rounded-lg border border-[#E2E8F0] bg-white">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn("px-4 py-3.5 font-semibold text-[#475569] text-xs uppercase tracking-wider", col.className)}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {data.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "hover:bg-[#F8FAFC] transition-colors",
                  onRowClick && "cursor-pointer"
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-4 py-3.5 text-[#0F172A]", col.className)}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout (Visible only on < 640px) */}
      <div className="flex flex-col gap-3 sm:hidden">
        {data.map((row) => (
          <div
            key={keyExtractor(row)}
            onClick={() => onRowClick?.(row)}
            className={cn(
              "rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-2xs flex flex-col gap-2.5 text-left",
              onRowClick && "active:bg-[#F8FAFC] cursor-pointer"
            )}
          >
            {columns.map((col) => (
              <div key={col.key} className="flex items-center justify-between gap-2 text-xs">
                <span className="font-medium text-[#64748B]">{col.header}</span>
                <span className="text-[#0F172A] font-medium text-right">
                  {col.render ? col.render(row) : row[col.key]}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
