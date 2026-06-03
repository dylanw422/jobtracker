import { api } from "@jobtracker/backend/convex/_generated/api";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ArrowLeft, CheckCircle2, Circle, DollarSign, MapPin } from "lucide-react";
import * as React from "react";
import { cn } from "@jobtracker/ui/lib/utils";

export const Route = createFileRoute("/admin-billing")({
  component: BillingSummary,
});

type CustomerGroup = {
  customerName: string;
  customerAddress: string;
  payment: number;
  allPaid: boolean;
};

function BillingSummary() {
  const entries = useQuery(api.entries.getAll, {});
  const [tab, setTab] = React.useState<"paid" | "unpaid">("unpaid");

  const groups = React.useMemo(() => {
    if (!entries) return null;

    const map = new Map<string, { entries: any[] }>();
    for (const entry of entries) {
      const key =
        entry.customerName.toLowerCase().trim() +
        "||" +
        (entry.customerAddress ?? "").toLowerCase().trim();
      if (!map.has(key)) map.set(key, { entries: [] });
      map.get(key)!.entries.push(entry);
    }

    const result: CustomerGroup[] = [];
    for (const { entries: groupEntries } of map.values()) {
      const sample = groupEntries[0];
      const allPaid = groupEntries.every((e) => e.customerPaid);
      const payment = Math.max(...groupEntries.map((e) => e.payment ?? 0));
      result.push({
        customerName: sample.customerName,
        customerAddress: sample.customerAddress ?? "",
        payment,
        allPaid,
      });
    }

    return result.sort((a, b) => a.customerName.localeCompare(b.customerName));
  }, [entries]);

  const paid = groups?.filter((g) => g.allPaid) ?? [];
  const unpaid = groups?.filter((g) => !g.allPaid) ?? [];

  const totalCollected = paid.reduce((s, g) => s + g.payment, 0);
  const totalBilled = unpaid.reduce((s, g) => s + g.payment, 0);

  const activeList = tab === "paid" ? paid : unpaid;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl pb-16">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link to="/admin">
          <button className="flex items-center justify-center w-9 h-9 rounded-lg border border-border/60 hover:bg-muted/50 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing Summary</h1>
          <p className="text-sm text-muted-foreground mt-0.5">All-time paid & unpaid customers</p>
        </div>
      </div>

      {entries === undefined ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-muted/50 border border-border/50 mb-6">
            {(["unpaid", "paid"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "py-2 rounded-md text-sm font-medium transition-all",
                  tab === t
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "paid" ? (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    Paid
                    <span className="text-xs text-muted-foreground">({paid.length})</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Circle className="h-3.5 w-3.5 text-red-500" />
                    Unpaid
                    <span className="text-xs text-muted-foreground">({unpaid.length})</span>
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Total banner */}
          <div
            className={cn(
              "flex items-center justify-between px-4 py-3 rounded-lg border mb-4",
              tab === "paid"
                ? "border-green-500/30 bg-green-500/5"
                : "border-red-500/30 bg-red-500/5"
            )}
          >
            <p className="text-sm font-medium text-muted-foreground">
              {tab === "paid" ? "Total Collected" : "Total Billed"}
            </p>
            <div
              className={cn(
                "flex items-center gap-1 text-lg font-bold",
                tab === "paid" ? "text-green-600" : "text-red-600"
              )}
            >
              <DollarSign className="h-5 w-5" />
              {(tab === "paid" ? totalCollected : totalBilled).toFixed(2)}
            </div>
          </div>

          {/* List */}
          {activeList.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10 border border-border/40 rounded-lg">
              {tab === "paid" ? "No paid customers yet." : "No outstanding balances."}
            </p>
          ) : (
            <div className="space-y-2">
              {activeList.map((g) => (
                <CustomerRow key={g.customerName + g.customerAddress} group={g} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CustomerRow({ group }: { group: CustomerGroup }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3.5 rounded-lg border border-border/60 border-l-4",
        group.allPaid ? "border-l-green-500" : "border-l-red-500"
      )}
    >
      <div className="flex gap-3 min-w-0">
        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{group.customerName}</p>
          {group.customerAddress && (
            <p className="text-xs text-muted-foreground truncate">{group.customerAddress}</p>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right ml-4">
        {group.payment > 0 ? (
          <p className={cn("text-sm font-bold", group.allPaid ? "text-green-600" : "text-foreground")}>
            ${group.payment.toFixed(2)}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">No amount set</p>
        )}
      </div>
    </div>
  );
}
