"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconBuildingBank,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconClock,
  IconDotsVertical,
  IconExternalLink,
  IconLayoutColumns,
  IconLoader,
  IconMapPin,
  IconPlus,
  IconRefresh,
  IconTrendingUp,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"

import { useVaults } from "@/hooks/use-protocol"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export interface Vault {
  id: number
  vaultAddress: string
  assetName: string
  assetType: string
  location: string
  status: string
  totalSupplied: string
  maxLiquidity: string
  utilizationRate: string
  borrowBaseRate: string
  fundingProgress: string
  isActive: boolean
  expectedReturn: string
}

function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

const columns: ColumnDef<Vault>[] = [
  {
    accessorKey: "assetName",
    header: "Asset",
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <span className="font-medium">{row.original.assetName}</span>
        <span className="text-muted-foreground text-xs flex items-center gap-1">
          <IconMapPin className="size-3" />
          {row.original.location}
        </span>
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "assetType",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground">
        <IconBuildingBank className="size-3" />
        {row.original.assetType}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <Badge
          variant="outline"
          className={
            status === "Active"
              ? "border-green-500/50 text-green-600 dark:text-green-400"
              : status === "Funding"
              ? "border-yellow-500/50 text-yellow-600 dark:text-yellow-400"
              : "text-muted-foreground"
          }
        >
          {status === "Active" ? (
            <IconCircleCheckFilled className="size-3 fill-green-500" />
          ) : status === "Funding" ? (
            <IconClock className="size-3" />
          ) : (
            <IconLoader className="size-3" />
          )}
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "totalSupplied",
    header: () => <div className="text-right">TVL</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {formatCurrency(row.original.totalSupplied)}
      </div>
    ),
  },
  {
    accessorKey: "maxLiquidity",
    header: () => <div className="text-right">Max Liquidity</div>,
    cell: ({ row }) => (
      <div className="text-right text-muted-foreground">
        {formatCurrency(row.original.maxLiquidity)}
      </div>
    ),
  },
  {
    accessorKey: "fundingProgress",
    header: "Funding",
    cell: ({ row }) => {
      const progress = parseFloat(row.original.fundingProgress)
      return (
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <span className="text-sm text-muted-foreground">{progress}%</span>
        </div>
      )
    },
  },
  {
    accessorKey: "utilizationRate",
    header: () => <div className="text-right">Utilization</div>,
    cell: ({ row }) => (
      <div className="text-right">
        <span className="font-medium">{row.original.utilizationRate}%</span>
      </div>
    ),
  },
  {
    accessorKey: "expectedReturn",
    header: () => <div className="text-right">APY</div>,
    cell: ({ row }) => (
      <div className="text-right flex items-center justify-end gap-1">
        <IconTrendingUp className="size-3 text-green-500" />
        <span className="font-medium text-green-600 dark:text-green-400">
          {row.original.expectedReturn}%
        </span>
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
          >
            <IconDotsVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/vaults/${row.original.id}`}>
              <IconExternalLink className="size-4 mr-2" />
              View Details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/vaults/${row.original.id}/revenue`}>
              Add Revenue
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/vaults/${row.original.id}/repayment`}>
              Process Repayment
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Pause Vault</DropdownMenuItem>
          <DropdownMenuItem variant="destructive">Close Vault</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

export function VaultsTable() {
  const { vaults, isLoading, error, refetch } = useVaults()
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  // Transform vaults data to match table format
  const data: Vault[] = React.useMemo(() => {
    return vaults.map((v) => ({
      id: v.id,
      vaultAddress: v.vaultAddress,
      assetName: v.assetName,
      assetType: v.assetType,
      location: v.location,
      status: v.status,
      totalSupplied: v.totalSupplied,
      maxLiquidity: v.maxLiquidity,
      utilizationRate: v.utilizationRate,
      borrowBaseRate: v.borrowBaseRate,
      fundingProgress: v.fundingProgress,
      isActive: v.isActive,
      expectedReturn: v.expectedReturn,
    }))
  }, [vaults])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const activeCount = data.filter((v) => v.status === "Active").length
  const fundingCount = data.filter((v) => v.status === "Funding").length

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 lg:px-6">
        <p className="text-destructive mb-4">Error loading vaults from blockchain</p>
        <Button variant="outline" onClick={() => refetch()}>
          <IconRefresh className="size-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <Tabs defaultValue="all" className="w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select defaultValue="all">
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vaults</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="funding">Funding</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="all">All Vaults</TabsTrigger>
          <TabsTrigger value="active">
            Active <Badge variant="secondary">{activeCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="funding">
            Funding <Badge variant="secondary">{fundingCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <IconRefresh className={isLoading ? "animate-spin" : ""} />
            <span className="hidden lg:inline">Refresh</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Columns</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="default" size="sm" asChild>
            <Link href="/dashboard/create-vault">
              <IconPlus />
              <span className="hidden lg:inline">Create Vault</span>
            </Link>
          </Button>
        </div>
      </div>
      <TabsContent value="all" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-2 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No vaults found. Create your first vault to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {isLoading ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              `${table.getFilteredRowModel().rows.length} vault(s) on-chain`
            )}
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount() || 1}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="active" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground">
          Active vaults will be displayed here
        </div>
      </TabsContent>
      <TabsContent value="funding" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground">
          Vaults in funding phase will be displayed here
        </div>
      </TabsContent>
      <TabsContent value="closed" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground">
          Closed vaults will be displayed here
        </div>
      </TabsContent>
    </Tabs>
  )
}
