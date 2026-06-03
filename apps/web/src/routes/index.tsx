import { api } from "@jobtracker/backend/convex/_generated/api";
import { Button } from "@jobtracker/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@jobtracker/ui/components/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@jobtracker/ui/components/form";
import { Input } from "@jobtracker/ui/components/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import * as React from "react";
import { format } from "date-fns";
import { Briefcase, Landmark, UserCircle } from "lucide-react";
import { cn } from "@jobtracker/ui/lib/utils";

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <span className="text-sm font-semibold text-foreground">{label}</span>
    </div>
  );
}


const formSchema = z.object({
  customerName: z.string().min(2, "Customer name is required"),
  customerAddress: z.string().min(3, "Address is required"),
  didBorrow: z.enum(["yes", "no"]).default("no"),
  borrowedAmount: z.coerce.number().min(0).optional(),
  borrowedNotes: z.string().optional(),
});

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const navigate = useNavigate();
  const createEntry = useMutation(api.entries.create);
  const updateEndTime = useMutation(api.entries.updateEndTime);

  const user = React.useMemo(() => {
    const stored = localStorage.getItem("user_session");
    return stored
      ? (JSON.parse(stored) as { userId: string; username: string; firstName: string; lastName: string })
      : null;
  }, []);

  React.useEffect(() => {
    if (!user) navigate({ to: "/auth" });
  }, [user, navigate]);

  // Clock state
  const [clockInTime, setClockInTime] = React.useState<number | null>(() => {
    const stored = localStorage.getItem("clock_in_time");
    return stored ? parseInt(stored, 10) : null;
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      customerAddress: "",
      didBorrow: "no",
      borrowedAmount: 0,
      borrowedNotes: "",
    },
  });

  const customerName = form.watch("customerName");
  const customerAddress = form.watch("customerAddress");
  const didBorrow = form.watch("didBorrow");
  const isClockedIn = clockInTime !== null;
  const canClockIn = customerName.trim().length >= 2 && customerAddress.trim().length >= 3;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;
    try {
      const now = Date.now();
      const entryId = await createEntry({
        employeeName: `${user.firstName} ${user.lastName}`,
        userId: user.userId,
        startTime: format(new Date(now), "HH:mm"),
        endTime: "",
        borrowedAmount: values.didBorrow === "yes" ? (values.borrowedAmount ?? 0) : 0,
        borrowedNotes: values.didBorrow === "yes" ? (values.borrowedNotes ?? "") : "",
        jobDescription: "",
        customerName: values.customerName,
        customerAddress: values.customerAddress,
        customerPaid: false,
        additionalNotes: "",
        entryDate: format(new Date(), "yyyy-MM-dd"),
        payment: 0,
      });
      // Start the clock after successful submit
      localStorage.setItem("clock_in_time", String(now));
      localStorage.setItem("current_entry_id", String(entryId));
      setClockInTime(now);
      toast.success("Clocked in!");
      form.reset({
        customerName: "",
        customerAddress: "",
        didBorrow: "no",
        borrowedAmount: 0,
        borrowedNotes: "",
      });
    } catch {
      toast.error("Failed to submit. Please try again.");
    }
  }

  async function handleClockOut() {
    const entryId = localStorage.getItem("current_entry_id");
    if (entryId) {
      try {
        await updateEndTime({
          id: entryId as any,
          endTime: format(new Date(), "HH:mm"),
        });
      } catch {
        // best-effort
      }
    }
    localStorage.removeItem("clock_in_time");
    localStorage.removeItem("current_entry_id");
    setClockInTime(null);
    toast.success("Clocked out.");
  }

  if (!user) return null;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="container mx-auto max-w-xl px-4 py-6 pb-28">
      <div className="mb-4 px-1">
        <h2 className="text-2xl font-bold tracking-tight">
          {greeting}, {user.firstName}!
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {format(new Date(), "EEEE, MMMM d")}
        </p>
      </div>

      <Card className="shadow-sm border border-border/60">
        <CardHeader className="pb-4 pt-6 px-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-xl font-bold">Daily Job Log</CardTitle>
            </div>
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full shrink-0">
              {format(new Date(), "MMM d")}
            </span>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7">

              {/* Customer Info */}
              <div className="space-y-3">
                <SectionHeader icon={UserCircle} label="Customer" />
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-muted-foreground">Customer Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Customer's name" className="h-11 rounded-lg" disabled={isClockedIn} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerAddress"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-muted-foreground">Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St, City, State" className="h-11 rounded-lg" disabled={isClockedIn} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t border-border/50" />

              {/* Borrowing */}
              <div className="space-y-3">
                <SectionHeader icon={Landmark} label="Borrowing" />
                <FormField
                  control={form.control}
                  name="didBorrow"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-muted-foreground">Did you borrow money today?</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-muted/50 border border-border/50">
                          {(["no", "yes"] as const).map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => field.onChange(val)}
                              className={cn(
                                "py-2 rounded-md text-sm font-medium transition-all",
                                field.value === val
                                  ? "bg-background shadow-sm text-foreground"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              {val === "no" ? "No" : "Yes"}
                            </button>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {didBorrow === "yes" && (
                  <div className="grid gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    <FormField
                      control={form.control}
                      name="borrowedAmount"
                      render={({ field }: { field: any }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-muted-foreground">Amount ($)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0.00" className="h-11 rounded-lg" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="borrowedNotes"
                      render={({ field }: { field: any }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-muted-foreground">Reason</FormLabel>
                          <FormControl>
                            <Input placeholder="What was the money for?" className="h-11 rounded-lg" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Sticky Clock In / Clock Out bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-border/60 px-4 py-3">
        <div className="container mx-auto max-w-xl">
          {isClockedIn ? (
            <Button
              type="button"
              className="w-full h-12 text-base font-semibold rounded-xl"
              onClick={handleClockOut}
            >
              Clock Out
            </Button>
          ) : (
            <Button
              type="button"
              className="w-full h-12 text-base font-semibold rounded-xl"
              disabled={!canClockIn}
              onClick={() => form.handleSubmit(onSubmit)()}
            >
              Clock In
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
