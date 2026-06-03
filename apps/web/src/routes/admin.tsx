import { api } from "@jobtracker/backend/convex/_generated/api";
import { Button } from "@jobtracker/ui/components/button";
import {
  Card,
  CardContent,
} from "@jobtracker/ui/components/card";
import { Input } from "@jobtracker/ui/components/input";
import { cn } from "@jobtracker/ui/lib/utils";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { format, addWeeks, startOfWeek, endOfWeek } from "date-fns";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Users,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle2,
  Circle,
} from "lucide-react";
import * as React from "react";

export const Route = createFileRoute("/admin")({
  component: AdminDashboard,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekRange(weekOffset: number) {
  const base = addWeeks(new Date(), weekOffset);
  const sun = startOfWeek(base, { weekStartsOn: 0 });
  const sat = endOfWeek(base, { weekStartsOn: 0 });
  return {
    start: format(sun, "yyyy-MM-dd"),
    end: format(sat, "yyyy-MM-dd"),
    label: `${format(sun, "MMM d")} – ${format(sat, "MMM d, yyyy")}`,
  };
}

function durationMins(startTime: string, endTime: string): number | null {
  if (!startTime || !endTime) return null;
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  if ([sh, sm, eh, em].some(isNaN)) return null;
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  return mins;
}

function fmtAddress(entry: any): string {
  if (entry.customerStreet) {
    const line2 = [entry.customerCity, entry.customerState, entry.customerZip]
      .filter(Boolean)
      .join(", ");
    return line2 ? `${entry.customerStreet}, ${line2}` : entry.customerStreet;
  }
  return entry.customerAddress ?? "";
}

function fmtMins(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

function AdminDashboard() {
  const [tab, setTab] = React.useState<"employees" | "customers">("employees");
  const [weekOffset, setWeekOffset] = React.useState(0);
  const [expandedUser, setExpandedUser] = React.useState<string | null>(null);

  const { start, end, label } = getWeekRange(weekOffset);

  const users = useQuery(api.users.list, {});
  const entries = useQuery(api.entries.getByDateRange, {
    startDate: start,
    endDate: end,
  });

  const userMap = new Map<string, any>();
  (users ?? []).forEach((u: any) => userMap.set(u._id, u));

  const entriesByUser = new Map<string, any[]>();
  (entries ?? []).forEach((e: any) => {
    const key = e.userId ?? e.employeeName;
    if (!entriesByUser.has(key)) entriesByUser.set(key, []);
    entriesByUser.get(key)!.push(e);
  });

  function totalMinsForUser(userEntries: any[]): number {
    return userEntries.reduce((sum, e) => {
      const m = durationMins(e.startTime, e.endTime);
      return sum + (m ?? 0);
    }, 0);
  }

  const loading = users === undefined || entries === undefined;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl pb-16">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Management Portal</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Week of {label}</p>
        </div>
        <Link to="/admin-billing">
          <Button className="h-11 px-5 gap-2 rounded-xl bg-white text-black hover:bg-white/90 text-sm font-semibold">
            <DollarSign className="h-4 w-4" />
            Billing
          </Button>
        </Link>
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between mb-5">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs border-border/60"
          onClick={() => setWeekOffset((w) => w - 1)}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Prev Week
        </Button>
        <button
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setWeekOffset(0)}
        >
          {weekOffset === 0 ? "This Week" : "Jump to Today"}
        </button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs border-border/60"
          onClick={() => setWeekOffset((w) => w + 1)}
          disabled={weekOffset >= 0}
        >
          Next Week
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-muted/50 border border-border/50 mb-6">
        {(["employees", "customers"] as const).map((t) => (
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
            {t === "employees" ? (
              <span className="flex items-center justify-center gap-2">
                <Users className="h-3.5 w-3.5" /> Employees
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <MapPin className="h-3.5 w-3.5" /> Customers
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : tab === "employees" ? (
        <EmployeesTab
          users={users ?? []}
          entriesByUser={entriesByUser}
          userMap={userMap}
          totalMinsForUser={totalMinsForUser}
          expandedUser={expandedUser}
          setExpandedUser={setExpandedUser}
        />
      ) : (
        <CustomersTab entries={entries ?? []} userMap={userMap} />
      )}
    </div>
  );
}

// ─── Employees Tab ────────────────────────────────────────────────────────────

function EmployeesTab({
  users,
  entriesByUser,
  userMap,
  totalMinsForUser,
  expandedUser,
  setExpandedUser,
}: {
  users: any[];
  entriesByUser: Map<string, any[]>;
  userMap: Map<string, any>;
  totalMinsForUser: (entries: any[]) => number;
  expandedUser: string | null;
  setExpandedUser: (id: string | null) => void;
}) {
  const allKeys = new Set<string>();
  users.forEach((u) => allKeys.add(u._id));
  entriesByUser.forEach((_, k) => allKeys.add(k));

  const rows = Array.from(allKeys).map((key) => {
    const user = userMap.get(key);
    const userEntries = entriesByUser.get(key) ?? [];
    const totalMins = totalMinsForUser(userEntries);
    const displayName = user ? `${user.firstName} ${user.lastName}` : key;
    return { key, displayName, userEntries, totalMins };
  });

  rows.sort((a, b) => a.displayName.localeCompare(b.displayName));

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-52 text-center">
        <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="font-semibold text-muted-foreground">No employees found</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Employees will appear here once they sign up.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rows.map(({ key, displayName, userEntries, totalMins }) => {
        const isOpen = expandedUser === key;
        const hasEntries = userEntries.length > 0;

        return (
          <Card key={key} className="border border-border/60 shadow-sm overflow-hidden">
            <button
              className="w-full text-left"
              onClick={() => setExpandedUser(isOpen ? null : key)}
            >
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 shrink-0">
                    <span className="text-sm font-bold text-primary">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      {userEntries.length}{" "}
                      {userEntries.length === 1 ? "visit" : "visits"} this week
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">
                      {totalMins > 0 ? fmtMins(totalMins) : "—"}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                      {totalMins > 0 ? "this week" : "no hours logged"}
                    </p>
                  </div>
                  {hasEntries &&
                    (isOpen ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    ))}
                </div>
              </div>
            </button>

            {isOpen && hasEntries && (
              <div className="border-t border-border/50">
                {userEntries.map((entry: any, i: number) => {
                  const mins = durationMins(entry.startTime, entry.endTime);
                  const inProgress = entry.startTime && !entry.endTime;
                  return (
                    <div
                      key={entry._id}
                      className={cn(
                        "px-5 py-3.5 flex items-start justify-between gap-4",
                        i < userEntries.length - 1 && "border-b border-border/30"
                      )}
                    >
                      <div className="flex gap-3 min-w-0">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {entry.customerName}
                          </p>
                          {fmtAddress(entry) && (
                            <p className="text-xs text-muted-foreground truncate">
                              {fmtAddress(entry)}
                            </p>
                          )}
                          {entry.borrowedAmount > 0 && (
                            <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                              <DollarSign className="h-2.5 w-2.5" />
                              Borrowed ${entry.borrowedAmount.toFixed(2)}
                              {entry.borrowedNotes ? ` · ${entry.borrowedNotes}` : ""}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        {inProgress ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-500/10 px-2 py-0.5 rounded uppercase tracking-wide">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                            In Progress
                          </span>
                        ) : mins !== null ? (
                          <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {fmtMins(mins)}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {entry.entryDate}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ─── Customers Tab ────────────────────────────────────────────────────────────

function CustomersTab({
  entries,
  userMap,
}: {
  entries: any[];
  userMap: Map<string, any>;
}) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-52 text-center">
        <MapPin className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="font-semibold text-muted-foreground">No customer visits this week</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Visits will appear here after employees clock in.
        </p>
      </div>
    );
  }

  // Group entries by customer name + structured address fields
  const groups = new Map<string, any[]>();
  for (const entry of entries) {
    const key = [
      entry.customerName,
      entry.customerStreet ?? entry.customerAddress ?? "",
      entry.customerCity ?? "",
      entry.customerState ?? "",
      entry.customerZip ?? "",
    ].map((s) => s.toLowerCase().trim()).join("||");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(entry);
  }

  const groupList = Array.from(groups.entries())
    .map(([, groupEntries]) => groupEntries)
    .sort((a, b) => a[0].customerName.localeCompare(b[0].customerName));

  return (
    <div className="space-y-2">
      {groupList.map((groupEntries) => (
        <CustomerGroup
          key={groupEntries[0]._id}
          entries={groupEntries}
        />
      ))}
    </div>
  );
}

// ─── Customer Group ───────────────────────────────────────────────────────────

function CustomerGroup({
  entries,
}: {
  entries: any[];
}) {
  const updateBilling = useMutation(api.entries.updateBilling);

  const [isOpen, setIsOpen] = React.useState(false);
  const [isSavingAmount, setIsSavingAmount] = React.useState(false);
  const [isSavingPaid, setIsSavingPaid] = React.useState(false);

  const sample = entries[0];
  const allPaid = entries.every((e) => e.customerPaid);
  const anyInProgress = entries.some((e) => e.startTime && !e.endTime);

  // Use the first entry as the canonical billing record
  const [billedAmount, setBilledAmount] = React.useState(
    sample.payment > 0 ? String(sample.payment) : ""
  );
  React.useEffect(() => {
    setBilledAmount(sample.payment > 0 ? String(sample.payment) : "");
  }, [sample.payment]);

  const savedAmount = sample.payment ?? 0;
  const parsedInput = parseFloat(billedAmount) || 0;
  const amountDirty = parsedInput !== savedAmount;

  async function handleSaveAmount() {
    setIsSavingAmount(true);
    try {
      await Promise.all(
        entries.map((e) =>
          updateBilling({ id: e._id, payment: parsedInput, customerPaid: e.customerPaid })
        )
      );
    } finally {
      setIsSavingAmount(false);
    }
  }

  async function handleTogglePaid() {
    setIsSavingPaid(true);
    try {
      await Promise.all(
        entries.map((e) =>
          updateBilling({ id: e._id, payment: parsedInput, customerPaid: !allPaid })
        )
      );
    } finally {
      setIsSavingPaid(false);
    }
  }

  return (
    <Card
      className={cn(
        "shadow-sm overflow-hidden border border-border/60 border-l-4",
        allPaid ? "border-l-green-500" : "border-l-red-500"
      )}
    >
      <button
        className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 hover:bg-muted/30 transition-colors"
        onClick={() => setIsOpen((o) => !o)}
      >
        <div className="flex gap-3 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted/60 shrink-0 mt-0.5">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{sample.customerName}</p>
            {fmtAddress(sample) && (
              <p className="text-xs text-muted-foreground">{fmtAddress(sample)}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {allPaid ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-500/10 px-2 py-0.5 rounded uppercase tracking-wide">
              <CheckCircle2 className="h-3 w-3" /> Paid
              {parsedInput > 0 && ` · $${parsedInput.toFixed(2)}`}
            </span>
          ) : anyInProgress ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-500/10 px-2 py-0.5 rounded uppercase tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              In Progress
            </span>
          ) : null}
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-border/50 px-5 py-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount billed"
                value={billedAmount}
                onChange={(e) => setBilledAmount(e.target.value)}
                className="pl-9 h-10 bg-background"
              />
            </div>
            <Button
              size="sm"
              className="h-10 px-5"
              disabled={!amountDirty || isSavingAmount}
              onClick={handleSaveAmount}
            >
              {isSavingAmount ? "Saving…" : amountDirty ? "Save" : "Saved"}
            </Button>
          </div>
          <button
            onClick={handleTogglePaid}
            disabled={isSavingPaid}
            className={cn(
              "w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-semibold transition-all",
              allPaid
                ? "border-green-500/40 bg-green-500/5 text-green-700"
                : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            {allPaid ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <Circle className="h-4 w-4 shrink-0" />
            )}
            {isSavingPaid
              ? "Updating…"
              : allPaid
              ? "Paid — click to mark unpaid"
              : "Mark as Paid"}
          </button>
        </div>
      )}
    </Card>
  );
}

