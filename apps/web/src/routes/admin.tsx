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

  React.useEffect(() => {
    if (!isAdmin) {
      navigate({ to: "/login" });
    }
  }, [isAdmin, navigate]);

  // Lock body scroll when modal is open and reset payment state
  React.useEffect(() => {
    if (selectedEntry) {
      document.body.style.overflow = "hidden";
      setPaymentAmount(selectedEntry.paidAmount?.toString() || "");
    } else {
      document.body.style.overflow = "unset";
      setPaymentAmount("");
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
    if (!entries) return { total: 0, paid: 0, borrowed: 0 };
    return entries.reduce(
      (acc: any, curr: any) => ({
        total: acc.total + 1,
        paid: acc.paid + (curr.customerPaid ? 1 : 0),
        borrowed: acc.borrowed + (curr.borrowedAmount > 0 ? curr.borrowedAmount : 0),
      }),
      { total: 0, paid: 0, borrowed: 0 },
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
      await updatePayment({
        id: selectedEntry._id,
        paidAmount: parsedAmount,
      });
      // Update local state to reflect the change immediately
      setSelectedEntry({ ...selectedEntry, paidAmount: parsedAmount });
    } catch (error) {
      console.error("Failed to update payment", error);
    } finally {
      setIsSavingPayment(false);
    }
  };

  if (!isAdmin) return null;

  // Determine if the input has changed from the saved database value
  const isPaymentDirty = Number(paymentAmount) !== Number(selectedEntry?.paidAmount || 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl pb-24">
      {/* Header Section */}
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Management
          </h1>
          <p className="text-muted-foreground font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Overview for {format(date, "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link to="/admin-settings">
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 border-foreground/10 hover:border-primary/50 transition-all"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "flex-1 sm:flex-none sm:w-[260px] h-11 justify-start text-left font-semibold border-foreground/10 shadow-sm transition-all hover:border-primary/50",
                  !date && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-3 h-5 w-5 text-primary" />
                {date ? format(date, "PPP") : <span>Select date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-none shadow-2xl" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
                className="rounded-xl border shadow-lg"
              />
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 border-foreground/10 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all shrink-0"
            onClick={handleLogout}
            title="Sign Out"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 mb-8">
        <Card className="border-none shadow-md ring-1 ring-foreground/5 bg-primary/5 col-span-2 md:col-span-1">
          <CardHeader className="pb-2 p-4 sm:p-6">
            <CardDescription className="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-primary/70">
              Total Jobs
            </CardDescription>
            <CardTitle className="text-2xl sm:text-3xl font-black">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-none shadow-md ring-1 ring-foreground/5 bg-green-500/5 p-4 sm:p-6">
          <CardHeader className="p-0 pb-2">
            <CardDescription className="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-green-600/70">
              Collected
            </CardDescription>
            <CardTitle className="text-2xl sm:text-3xl font-black text-green-600">
              {stats.paid}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-none shadow-md ring-1 ring-foreground/5 bg-destructive/5 p-4 sm:p-6">
          <CardHeader className="p-0 pb-2">
            <CardDescription className="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-destructive/70">
              Borrowed
            </CardDescription>
            <CardTitle className="text-2xl sm:text-3xl font-black text-destructive">
              ${stats.borrowed.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
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
                            <div className="font-bold text-sm sm:text-base text-foreground break-words pr-2 flex items-center gap-2">
                              {entry.customerName}
                              {entry.paidAmount > 0 && (
                                <span className="inline-flex text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm">
                                  ${entry.paidAmount.toFixed(2)}
                                </span>
                              )}
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
                                <span className="inline-flex items-center text-green-600 bg-green-500/10 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                                  Paid
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-destructive bg-destructive/10 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                                  Unpaid
                                </span>
                              )}
                              {entry.borrowedAmount > 0 && (
                                <span className="text-[11px] font-bold text-destructive flex items-center bg-destructive/5 px-2 py-0.5 rounded">
                                  <DollarSign className="h-3 w-3" />
                                  {entry.borrowedAmount.toFixed(2)}
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg shadow-2xl relative max-h-[90vh] flex flex-col border-foreground/10 overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4 border-b shrink-0 pr-12 p-4 sm:p-6">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-3 top-3 hover:bg-muted/80 rounded-full"
                onClick={() => setSelectedEntry(null)}
              >
                <XCircle className="h-6 w-6 text-muted-foreground hover:text-foreground transition-colors" />
              </Button>
              <CardTitle className="text-xl font-bold break-words pr-4 text-foreground">
                {selectedEntry.customerName}
              </CardTitle>
              <CardDescription className="font-medium text-sm mt-1 text-foreground/70">
                Serviced by{" "}
                <span className="font-bold text-foreground">{selectedEntry.employeeName}</span>
              </CardDescription>
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

              {/* Borrowed Finances block */}
              {selectedEntry.borrowedAmount > 0 && (
                <div className="bg-destructive/5 p-4 rounded-xl space-y-2 border border-destructive/10">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-destructive">Borrowed Amount</span>
                    <span className="text-lg font-black text-destructive flex items-center gap-0.5">
                      <DollarSign className="h-4 w-4" />
                      {selectedEntry.borrowedAmount.toFixed(2)}
                    </span>
                  </div>
                  {selectedEntry.borrowedNotes && (
                    <p className="text-xs text-destructive/80 italic font-medium">
                      "{selectedEntry.borrowedNotes}"
                    </p>
                  )}
                </div>
              )}

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
