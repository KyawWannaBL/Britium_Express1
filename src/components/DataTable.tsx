import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { getStatusColor, getStatusLabel, DeliveryStatus, PaymentStatus } from '@/lib/index';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  onRowClick?: (row: any) => void;
  actions?: Array<{ label: string; onClick: (row: any) => void }>;
  searchable?: boolean;
  selectable?: boolean;
  onSelectionChange?: (selectedRows: any[]) => void;
}

export function DataTable({
  columns,
  data,
  onRowClick,
  actions,
  searchable = true,
  selectable = false,
  onSelectionChange,
}: DataTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const handleSort = (key: string) => {
    const column = columns.find((col) => col.key === key);
    if (!column?.sortable) return;

    setSortConfig((current) => {
      if (current?.key === key) {
        return current.direction === 'asc'
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredAndSortedData.map((row) => row.id));
      setSelectedRows(allIds);
      onSelectionChange?.(filteredAndSortedData);
    } else {
      setSelectedRows(new Set());
      onSelectionChange?.([]);
    }
  };

  const handleSelectRow = (rowId: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(rowId);
    } else {
      newSelected.delete(rowId);
    }
    setSelectedRows(newSelected);
    const selectedData = data.filter((row) => newSelected.has(row.id));
    onSelectionChange?.(selectedData);
  };

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    if (searchQuery) {
      result = result.filter((row) =>
        columns.some((col) => {
          const value = row[col.key];
          return value
            ?.toString()
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        })
      );
    }

    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === bValue) return 0;

        const comparison = aValue < bValue ? -1 : 1;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, searchQuery, sortConfig, columns]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedData.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize);

  const renderCellValue = (column: Column, row: any) => {
    const value = row[column.key];

    if (column.render) {
      return column.render(value, row);
    }

    if (column.key === 'status') {
      const isDeliveryStatus = Object.values(DeliveryStatus).includes(
        value as DeliveryStatus
      );
      const isPaymentStatus = Object.values(PaymentStatus).includes(
        value as PaymentStatus
      );

      if (isDeliveryStatus || isPaymentStatus) {
        return (
          <Badge
            variant="secondary"
            className={`${getStatusColor(value)} font-medium`}
          >
            {getStatusLabel(value)}
          </Badge>
        );
      }
    }

    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">—</span>;
    }

    return value;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        {searchable && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {selectable && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      selectedRows.size === filteredAndSortedData.length &&
                      filteredAndSortedData.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead key={column.key}>
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column.key)}
                      className="flex items-center gap-2 font-semibold hover:text-primary transition-colors"
                    >
                      {column.label}
                      {sortConfig?.key === column.key ? (
                        sortConfig.direction === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )
                      ) : (
                        <ChevronDown className="h-4 w-4 opacity-0 group-hover:opacity-50" />
                      )}
                    </button>
                  ) : (
                    <span className="font-semibold">{column.label}</span>
                  )}
                </TableHead>
              ))}
              {actions && actions.length > 0 && (
                <TableHead className="w-12"></TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)}
                  className="text-center py-12 text-muted-foreground"
                >
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => (
                <TableRow
                  key={row.id || index}
                  onClick={() => onRowClick?.(row)}
                  className={`${
                    onRowClick ? 'cursor-pointer' : ''
                  } hover:bg-muted/50 transition-colors`}
                >
                  {selectable && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedRows.has(row.id)}
                        onCheckedChange={(checked) =>
                          handleSelectRow(row.id, checked as boolean)
                        }
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {renderCellValue(column, row)}
                    </TableCell>
                  ))}
                  {actions && actions.length > 0 && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {actions.map((action, actionIndex) => (
                            <DropdownMenuItem
                              key={actionIndex}
                              onClick={() => action.onClick(row)}
                            >
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredAndSortedData.length)} of{' '}
            {filteredAndSortedData.length} results
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-9"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}