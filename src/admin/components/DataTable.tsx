import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import EmptyState from "./EmptyState";

export interface DataTableColumn<Row> {
  key: string;
  header: React.ReactNode;
  render: (row: Row) => React.ReactNode;
  className?: string;
  width?: string;
}

interface DataTableProps<Row> {
  title?: string;
  description?: string;
  columns: DataTableColumn<Row>[];
  data: Row[];
  rowKey: (row: Row) => string;
  searchPlaceholder?: string;
  onSearch?: (q: string) => void;
  searchValue?: string;
  filters?: React.ReactNode;
  toolbarRight?: React.ReactNode;
  onRowClick?: (row: Row) => void;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

function DataTable<Row>({
  title,
  description,
  columns,
  data,
  rowKey,
  searchPlaceholder = "検索...",
  onSearch,
  searchValue,
  filters,
  toolbarRight,
  onRowClick,
  pageSize = 10,
  emptyTitle,
  emptyDescription,
  className,
}: DataTableProps<Row>) {
  const [internalSearch, setInternalSearch] = useState("");
  const [page, setPage] = useState(1);

  const search = searchValue ?? internalSearch;
  const handleSearchChange = (next: string) => {
    if (onSearch) {
      onSearch(next);
    } else {
      setInternalSearch(next);
    }
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, safePage, pageSize]);

  return (
    <div className={cn("rounded-lg border bg-white shadow-sm", className)}>
      {(title || description || onSearch || filters || toolbarRight) && (
        <div className="flex flex-col gap-3 border-b px-5 py-4">
          {(title || description) && (
            <div className="flex items-end justify-between gap-3">
              <div>
                {title ? <h2 className="text-base font-semibold text-slate-900">{title}</h2> : null}
                {description ? <p className="text-xs text-slate-500">{description}</p> : null}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 pl-9"
              />
            </div>
            {filters ? <div className="flex flex-wrap items-center gap-2">{filters}</div> : null}
            {toolbarRight ? <div className="ml-auto flex items-center gap-2">{toolbarRight}</div> : null}
          </div>
        </div>
      )}

      <div className="overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow className="hover:bg-gray-50">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn("text-xs font-medium uppercase tracking-wider text-slate-500", col.className)}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="p-0">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row) => (
                <TableRow
                  key={rowKey(row)}
                  className={cn(onRowClick && "cursor-pointer")}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data.length > pageSize ? (
        <div className="flex items-center justify-between border-t px-5 py-3 text-xs text-slate-500">
          <div>
            {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, data.length)} / {data.length} 件
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="前のページ"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2">
              {safePage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="次のページ"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default DataTable;
