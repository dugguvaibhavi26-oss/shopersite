import * as React from "react";
import { cn } from "@/lib/utils";
import { GripVertical, ArrowUp, ArrowDown } from "lucide-react";

export interface ReorderItem {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export interface ReorderListProps {
  items: ReorderItem[];
  onChange: (items: ReorderItem[]) => void;
  className?: string;
}

export function ReorderList({ items, onChange, className }: ReorderListProps) {
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);

  const moveItem = (index: number, direction: "up" | "down") => {
    const newItems = [...items];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    onChange(newItems);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (_e: React.DragEvent<HTMLDivElement>, index: number) => {
    if (dragOverIndex === index) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...items];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, moved);
    onChange(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className={cn("flex flex-col gap-2.5 w-full select-none", className)}>
      {items.map((item, index) => {
        const isDragging = draggedIndex === index;
        const isDragOver = dragOverIndex === index && draggedIndex !== index;

        return (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={(e) => handleDragLeave(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              "flex items-center justify-between p-3.5 sm:p-4 rounded-xl border bg-white transition-all cursor-grab active:cursor-grabbing",
              isDragging
                ? "opacity-40 border-dashed border-neutral-400 bg-neutral-50 scale-[0.99] shadow-inner"
                : isDragOver
                ? "border-black ring-2 ring-black/10 bg-neutral-50/90 shadow-md -translate-y-0.5"
                : "border-neutral-200/90 hover:border-neutral-400 hover:shadow-xs shadow-2xs"
            )}
          >
            <div className="flex items-center gap-3 min-w-0 pr-2">
              {/* Drag Handle */}
              <div
                className="text-neutral-400 hover:text-black p-1 rounded-md transition-colors shrink-0"
                title="Drag to reorder"
              >
                <GripVertical className="w-4 h-4" />
              </div>

              {/* Order Number Badge */}
              <div className="w-6 h-6 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-[11px] font-bold text-neutral-700 shrink-0">
                {index + 1}
              </div>

              {item.icon && <div className="text-neutral-800 shrink-0">{item.icon}</div>}

              <div className="flex flex-col text-left min-w-0">
                <span className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                  {item.title}
                </span>
                {item.subtitle && (
                  <span className="text-[11px] text-neutral-500 truncate mt-0.5">
                    {item.subtitle}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Move Buttons (Fallback / Touch) */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                data-testid={`btn-move-up-${item.id}`}
                disabled={index === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  moveItem(index, "up");
                }}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer"
                aria-label="Move section up"
                title="Move up"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                data-testid={`btn-move-down-${item.id}`}
                disabled={index === items.length - 1}
                onClick={(e) => {
                  e.stopPropagation();
                  moveItem(index, "down");
                }}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer"
                aria-label="Move section down"
                title="Move down"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
