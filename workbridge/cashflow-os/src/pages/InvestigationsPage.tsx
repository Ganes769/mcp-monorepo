import { Link, useNavigate } from "react-router";
import { ScanSearch } from "lucide-react";

import { useMemo } from "react";

import { useSyncedInvoices } from "@/hooks/useXero";

import {
  activeInvoices,
  invoiceAmount,
  invoiceContactName,
  invoiceDueDate,
  invoiceXeroStatus,
  invoiceStatusTone,
} from "@/lib/xeroFields";

import { formatDate, formatMoney } from "@/lib/format";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { PageHeader } from "@/components/shared/PageHeader";

import {
  EmptyState,
  ErrorState,
  LoadingRows,
} from "@/components/shared/states";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="flex-row items-center gap-3 p-4">
      <span className="size-2.5 rounded-full bg-sun" aria-hidden />

      <span className="text-[13px] text-muted-foreground">{label}</span>

      <span className="ml-auto text-xl font-semibold tabular">{value}</span>
    </Card>
  );
}

export function InvestigationsPage() {
  const navigate = useNavigate();

  // ============================================================
  // REAL INVOICES FROM YOUR DATABASE / XERO SYNC
  // ============================================================

  const { data, isLoading, error, refetch } = useSyncedInvoices(true);
  console.log(data);
  const invoices = useMemo(() => activeInvoices(data?.invoices), [data]);

  // ============================================================
  // OVERDUE INVOICES
  // ============================================================

  const overdueInvoices = useMemo(() => {
    const today = new Date();

    return invoices.filter((invoice) => {
      const dueDate = invoiceDueDate(invoice);

      if (!dueDate) {
        return false;
      }

      const status = invoiceXeroStatus(invoice)?.toUpperCase();

      // Already paid -> not overdue
      if (status === "PAID" || status === "VOIDED" || status === "DELETED") {
        return false;
      }

      return new Date(dueDate) < today;
    });
  }, [invoices]);

  // ============================================================
  // STATS
  // ============================================================

  const inProgress = 0;

  const waitingForHuman = 0;

  const monitoring = overdueInvoices.length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="AI Investigations"
        description="Overdue invoices from your Xero organisation that can be investigated by the AI agent."
      />

      {/* ========================================================
          STATS
      ======================================================== */}

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="In progress" value={inProgress} />

        <Stat label="Waiting for a human" value={waitingForHuman} />

        <Stat label="Overdue to investigate" value={monitoring} />
      </div>

      {/* ========================================================
          TABLE
      ======================================================== */}

      <Card className="overflow-hidden">
        {error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : isLoading ? (
          <LoadingRows rows={8} />
        ) : overdueInvoices.length === 0 ? (
          <EmptyState
            icon={ScanSearch}
            title="No overdue invoices"
            description="There are currently no overdue invoices that need an investigation."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Invoice</TableHead>

                <TableHead>Customer</TableHead>

                <TableHead className="text-right">Outstanding</TableHead>

                <TableHead>Stage</TableHead>

                <TableHead>AI-identified likely reason</TableHead>

                <TableHead>Confidence</TableHead>

                <TableHead>Invoice status</TableHead>

                <TableHead>Due date</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {overdueInvoices.map((invoice) => {
                const status = invoiceXeroStatus(invoice) || "UNKNOWN";

                const dueDate = invoiceDueDate(invoice);

                return (
                  <TableRow
                    key={invoice.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/app/invoices/${invoice.id}`)}
                  >
                    {/* INVOICE */}

                    <TableCell className="font-semibold">
                      <Link
                        to={`/app/invoices/${invoice.id}`}
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {invoice.invoice_number || invoice.id}
                      </Link>
                    </TableCell>

                    {/* CUSTOMER */}

                    <TableCell>{invoiceContactName(invoice)}</TableCell>

                    {/* AMOUNT */}

                    <TableCell className="text-right font-medium tabular">
                      {formatMoney(invoiceAmount(invoice), {
                        precise: true,
                      })}
                    </TableCell>

                    {/* STAGE */}

                    <TableCell>
                      <Badge variant="outline">Not started</Badge>
                    </TableCell>

                    {/* AI REASON */}

                    <TableCell className="text-muted-foreground">—</TableCell>

                    {/* CONFIDENCE */}

                    <TableCell className="text-muted-foreground">—</TableCell>

                    {/* INVOICE STATUS */}

                    <TableCell>
                      <Badge variant={invoiceStatusTone(status)}>
                        {status}
                      </Badge>
                    </TableCell>

                    {/* DUE DATE */}

                    <TableCell className="text-muted-foreground">
                      {dueDate ? formatDate(dueDate) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
