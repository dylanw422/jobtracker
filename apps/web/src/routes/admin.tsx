import { api } from "@jobtracker/backend/convex/_generated/api";
import { Button } from "@jobtracker/ui/components/button";
import { Calendar } from "@jobtracker/ui/components/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@jobtracker/ui/components/card";
import { Popover, PopoverContent, PopoverTrigger } from "@jobtracker/ui/components/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@jobtracker/ui/components/table";
import { cn } from "@jobtracker/ui/lib/utils";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { format } from "date-fns";
import {
  CalendarIcon,
  LogOut,
  Users,
  Search,
  DollarSign,
  CheckCircle,
  XCircle,
  Settings,
  ChevronRight,
  Clock,
  User,
} from "lucide-react";
import * as React from "react";
import { Input } from "@jobtracker/ui/components/input";

export const Route = createFileRoute("/admin")({
  component: AdminDashboard,
});

// Helper function to calculate duration between two time strings (e.g. "08:00 AM" to "10:30 AM")
const calculateDuration = (startTime?: string, endTime?: string) => {
  if (!startTime || !endTime) return "N/A";

  const parseTime = (timeStr: string) => {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM|am|pm)?/);
    if (!match) return NaN;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const modifier = match[3]?.toUpperCase();

    if (modifier === "AM" && hours === 12) hours = 0;
    if (modifier === "PM" && hours < 12) hours += 12;

    return hours * 60 + minutes;
  };

  const startMins = parseTime(startTime);
  let endMins = parseTime(endTime);

  if (isNaN(startMins) || isNaN(endMins)) {
    return "N/A";
  }

  // Handle overnight shifts if end time is earlier than start time
  if (endMins < startMins) {
    endMins += 24 * 60;
  }

  const diffMins = endMins - startMins;
  const h = Math.floor(diffMins / 60);
  const m = diffMins % 60;

  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

function AdminDashboard() {
  const [date, setDate] = React.useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedEntry, setSelectedEntry] = React.useState<any>(null);

  // States for payment input
  const [paymentAmount, setPaymentAmount] = React.useState("");
  const [isSavingPayment, setIsSavingPayment] = React.useState(false);

  const navigate = useNavigate();

  const isAdmin = typeof window !== "undefined" && localStorage.getItem("admin_session") === "true";

  // IMPORTANT: Ensure you have an 'updatePayment' mutation in your Convex backend that takes { id, paidAmount }
  const updatePayment = useMutation(api.entries.updatePayment);
  const updateBorrowed = useMutation(api.entries.updateBorrowed);

  // Borrowed editing state
  const [borrowedAmountInput, setBorrowedAmountInput] = React.useState("");
  const [borrowedNotesInput, setBorrowedNotesInput] = React.useState("");
  const [isSavingBorrowed, setIsSavingBorrowed] = React.useState(false);

  React.useEffect(() => {
    if (!isAdmin) {
      navigate({ to: "/login" });
    }
  }, [isAdmin, navigate]);

  // Lock body scroll when modal is open and reset payment/borrowed state
  React.useEffect(() => {
    if (selectedEntry) {
      document.body.style.overflow = "hidden";
      setPaymentAmount(selectedEntry.payment?.toString() || "");
      setBorrowedAmountInput(selectedEntry.borrowedAmount?.toString() || "0");
      setBorrowedNotesInput(selectedEntry.borrowedNotes || "");
    } else {
      document.body.style.overflow = "unset";
      setPaymentAmount("");
      setBorrowedAmountInput("");
      setBorrowedNotesInput("");
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedEntry]);

  const formattedDate = React.useMemo(() => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split("T")[0];
  }, [date]);

  const entries = useQuery(api.entries.getByDate, { entryDate: formattedDate });

  const filteredEntries = React.useMemo(() => {
    if (!entries) return [];
    return entries.filter(
      (entry: any) =>
        entry.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.jobDescription.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [entries, searchTerm]);

  const stats = React.useMemo(() => {
    if (!entries) return { total: 0, paid: 0, borrowed: 0, revenue: 0 };
    return entries.reduce(
      (acc: any, curr: any) => ({
        total: acc.total + 1,
        paid: acc.paid + (curr.customerPaid ? 1 : 0),
        borrowed: acc.borrowed + (curr.borrowedAmount > 0 ? curr.borrowedAmount : 0),
        revenue: acc.revenue + (curr.payment > 0 ? curr.payment : 0),
      }),
      { total: 0, paid: 0, borrowed: 0, revenue: 0 },
    );
  }, [entries]);

  const handleLogout = () => {
    localStorage.removeItem("admin_session");
    navigate({ to: "/" });
  };

  const handleSavePayment = async () => {
    if (!selectedEntry) return;
    setIsSavingPayment(true);
    try {
      const parsedAmount = parseFloat(paymentAmount) || 0;
      await updatePayment({ id: selectedEntry._id, paidAmount: parsedAmount });
      setSelectedEntry({ ...selectedEntry, payment: parsedAmount });
    } catch (error) {
      console.error("Failed to update payment", error);
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleSaveBorrowed = async () => {
    if (!selectedEntry) return;
    setIsSavingBorrowed(true);
    try {
      const amount = parseFloat(borrowedAmountInput) || 0;
      await updateBorrowed({
        id: selectedEntry._id,
        borrowedAmount: amount,
        borrowedNotes: borrowedNotesInput,
      });
      setSelectedEntry({
        ...selectedEntry,
        borrowedAmount: amount,
        borrowedNotes: borrowedNotesInput,
      });
    } catch (error) {
      console.error("Failed to update borrowed amount", error);
    } finally {
      setIsSavingBorrowed(false);
    }
  };

  if (!isAdmin) return null;

  const isPaymentDirty = Number(paymentAmount) !== Number(selectedEntry?.payment ?? 0);
  const isBorrowedDirty =
    parseFloat(borrowedAmountInput) !== (selectedEntry?.borrowedAmount ?? 0) ||
    borrowedNotesInput !== (selectedEntry?.borrowedNotes ?? "");

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl pb-24">
      {/* Header Section */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {format(date, "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 sm:flex-none sm:w-auto h-10 gap-2 border-border/60 font-medium text-sm"
              >
                <CalendarIcon className="h-4 w-4 text-primary" />
                {format(date, "MMM d, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 shadow-xl" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Link to="/admin-settings">
            <Button variant="outline" size="icon" className="h-10 w-10 border-border/60" title="Settings">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 border-border/60 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors shrink-0"
            onClick={handleLogout}
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Total Jobs", value: stats.total, color: "text-foreground", bg: "bg-muted/40" },
          { label: "Collected", value: stats.paid, color: "text-green-600", bg: "bg-green-500/5" },
          { label: "Revenue", value: `$${stats.revenue.toFixed(2)}`, color: "text-primary", bg: "bg-primary/5" },
          { label: "Borrowed", value: `$${stats.borrowed.toFixed(2)}`, color: "text-destructive", bg: "bg-destructive/5" },
        ].map(({ label, value, color, bg }) => (
          <Card key={label} className={cn("border border-border/50 shadow-sm", bg)}>
            <CardHeader className="p-4">
              <CardDescription className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                {label}
              </CardDescription>
              <CardTitle className={cn("text-2xl font-black mt-1", color)}>
                {value}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Card className="border-none shadow-xl ring-1 ring-foreground/5 overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4 sm:pb-6 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl font-bold">Entry Records</CardTitle>
              <CardDescription className="text-xs sm:text-sm font-medium">
                {filteredEntries.length} entries found
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search records..."
                className="pl-10 h-10 border-foreground/10 focus:ring-primary/20 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {entries === undefined ? (
            <div className="flex h-64 flex-col items-center justify-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-muted-foreground font-medium">Fetching job entries...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center p-8">
              <Search className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-lg font-semibold text-muted-foreground">No records found</p>
              <p className="text-sm text-muted-foreground/70 max-w-xs mt-1">
                Try selecting a different date or adjusting your search term.
              </p>
            </div>
          ) : (
            <div className="w-full">
              <Table className="w-full">
                <TableHeader className="bg-muted/50 hidden sm:table-header-group">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="py-3 px-4 font-bold text-foreground">
                      Job Details
                    </TableHead>
                    <TableHead className="py-3 px-4 font-bold text-foreground text-right">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry: any) => (
                    <TableRow
                      key={entry._id}
                      onClick={() => setSelectedEntry(entry)}
                      className="group cursor-pointer transition-colors hover:bg-muted/30 border-b border-foreground/5 active:bg-muted/50"
                    >
                      <TableCell className="py-4 px-4 align-top w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="font-bold text-sm sm:text-base text-foreground break-words pr-2">
                              {entry.customerName}
                            </div>
                            <div className="text-[11px] sm:text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-foreground/80 flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {entry.employeeName}
                              </span>
                              <span className="opacity-50">•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {calculateDuration(entry.startTime, entry.endTime)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 mt-2 sm:mt-0">
                            <div className="flex items-center gap-2">
                              {entry.customerPaid ? (
                                <span className="inline-flex items-center gap-1 text-green-600 bg-green-500/10 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                                  Paid
                                  {entry.payment > 0 && (
                                    <span className="normal-case">· ${entry.payment.toFixed(2)}</span>
                                  )}
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-destructive bg-destructive/10 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                                  Unpaid
                                </span>
                              )}
                              {entry.borrowedAmount > 0 && (
                                <span className="text-[10px] font-bold text-destructive flex items-center gap-1 bg-destructive/5 px-2 py-0.5 rounded uppercase tracking-wide">
                                  Borrowed · ${entry.borrowedAmount.toFixed(2)}
                                </span>
                              )}
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <footer className="mt-8 text-center text-xs text-muted-foreground/60 font-medium">
        <p>Job Tracker Management Portal • v1.2.0</p>
      </footer>

      {/* Detail View Modal */}
      {selectedEntry && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedEntry(null); }}
        >
          <Card className="w-full max-w-lg shadow-2xl relative max-h-[90vh] flex flex-col border-border/60 overflow-hidden animate-in zoom-in-95 duration-150">
            <CardHeader className="pb-4 border-b shrink-0 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg font-bold text-foreground break-words">
                    {selectedEntry.customerName}
                  </CardTitle>
                  <CardDescription className="text-sm mt-0.5">
                    Serviced by <span className="font-semibold text-foreground">{selectedEntry.employeeName}</span>
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-8 w-8 rounded-lg hover:bg-muted"
                  onClick={() => setSelectedEntry(null)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="overflow-y-auto p-4 sm:p-6 space-y-5 flex-1">
              {/* Top Meta Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/40 p-3 rounded-xl border border-foreground/5 flex flex-col justify-center">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Time Worked
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {calculateDuration(selectedEntry.startTime, selectedEntry.endTime)}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {selectedEntry.startTime} - {selectedEntry.endTime}
                  </div>
                </div>

                <div className="bg-muted/40 p-3 rounded-xl border border-foreground/5 flex flex-col justify-center">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Customer Paid Status
                  </div>
                  <div>
                    {selectedEntry.customerPaid ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-500/10 px-2 py-1 rounded-md">
                        <CheckCircle className="h-3.5 w-3.5" /> PAID
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-destructive bg-destructive/10 px-2 py-1 rounded-md">
                        <XCircle className="h-3.5 w-3.5" /> UNPAID
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Admin Payment Controls */}
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-3">
                <div className="text-[10px] font-bold text-primary uppercase tracking-wider">
                  Compensation / Job Revenue
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-9 h-10 bg-background border-primary/20 focus:border-primary/50 font-medium"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleSavePayment}
                    disabled={isSavingPayment || !isPaymentDirty}
                    className="h-10 min-w-[80px]"
                  >
                    {isSavingPayment ? "Saving..." : isPaymentDirty ? "Save" : "Saved"}
                  </Button>
                </div>
              </div>

              {/* Borrowed Finances block — always editable */}
              <div className="bg-destructive/5 p-4 rounded-xl border border-destructive/10 space-y-3">
                <div className="text-[10px] font-bold text-destructive uppercase tracking-wider">
                  Borrowed Amount
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="pl-9 h-10 bg-background border-destructive/20 focus:border-destructive/50 font-medium"
                      value={borrowedAmountInput}
                      onChange={(e) => setBorrowedAmountInput(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleSaveBorrowed}
                    disabled={isSavingBorrowed || !isBorrowedDirty}
                    variant="destructive"
                    className="h-10 min-w-[80px]"
                  >
                    {isSavingBorrowed ? "Saving..." : isBorrowedDirty ? "Save" : "Saved"}
                  </Button>
                </div>
                <Input
                  placeholder="Reason for borrowing..."
                  className="h-10 bg-background border-destructive/20 focus:border-destructive/50 text-sm"
                  value={borrowedNotesInput}
                  onChange={(e) => setBorrowedNotesInput(e.target.value)}
                />
              </div>

              {/* Descriptions */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">
                  Job Description
                </div>
                <div className="text-sm text-foreground bg-muted/20 border border-foreground/5 p-4 rounded-xl leading-relaxed">
                  {selectedEntry.jobDescription || (
                    <span className="text-muted-foreground/50 italic">
                      No description provided.
                    </span>
                  )}
                </div>
              </div>

              {selectedEntry.additionalNotes && (
                <div className="bg-blue-500/5 border-l-4 border-blue-500 p-3 rounded-r-xl">
                  <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">
                    Additional Notes
                  </p>
                  <p className="text-sm text-blue-700 font-medium italic leading-relaxed">
                    "{selectedEntry.additionalNotes}"
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
