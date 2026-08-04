import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  pageSize: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers
  const pages: (number | string)[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="px-5 py-3 border-t border-border/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
      <div className="text-muted-foreground font-mono">
        Showing <span className="font-semibold text-foreground">{startItem}</span> to{" "}
        <span className="font-semibold text-foreground">{endItem}</span> of{" "}
        <span className="font-semibold text-foreground">{totalItems}</span> entries
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-md border border-border bg-white text-foreground hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          title="Previous Page"
        >
          <ChevronLeft size={14} />
        </button>

        {pages.map((p, idx) =>
          typeof p === "number" ? (
            <button
              key={idx}
              onClick={() => onPageChange(p)}
              className={`w-7 h-7 rounded-md font-mono font-semibold text-xs transition-all ${
                currentPage === p
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-white border border-border text-foreground hover:bg-slate-100"
              }`}
            >
              {p}
            </button>
          ) : (
            <span key={idx} className="px-1 text-muted-foreground font-mono">
              ...
            </span>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-md border border-border bg-white text-foreground hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          title="Next Page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
