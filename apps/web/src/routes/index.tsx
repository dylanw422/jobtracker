import { api } from "@jobtracker/backend/convex/_generated/api";
import { Button } from "@jobtracker/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@jobtracker/ui/components/card";
import { Checkbox } from "@jobtracker/ui/components/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@jobtracker/ui/components/form";
import { Input } from "@jobtracker/ui/components/input";
import { Textarea } from "@jobtracker/ui/components/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import * as React from "react";
import { format } from "date-fns";
import { Clock, User, Landmark, Briefcase, UserCircle, CheckCircle2, FileText } from "lucide-react";
import { cn } from "@jobtracker/ui/lib/utils";

// ─── Time Input ──────────────────────────────────────────────────────────────

function parseTime(value: string) {
  if (!value) return { h12: "", min: "", period: "AM" as "AM" | "PM" };
  const [hs, ms] = value.split(":");
  const h24 = parseInt(hs, 10);
  const m = parseInt(ms, 10);
  if (isNaN(h24) || isNaN(m)) return { h12: "", min: "", period: "AM" as "AM" | "PM" };
  return {
    h12: String(h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24),
    min: String(m).padStart(2, "0"),
    period: (h24 >= 12 ? "PM" : "AM") as "AM" | "PM",
  };
}

const TimeInput = React.forwardRef<HTMLInputElement, {
  value?: string;
  onChange?: (val: string) => void;
  onBlur?: () => void;
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
  className?: string;
}>(function TimeInput(
  { value = "", onChange, onBlur, id, "aria-describedby": ariaDescribedBy, "aria-invalid": ariaInvalid, className },
  ref
) {
  const initial = parseTime(value);
  const [hour, setHour] = React.useState(initial.h12);
  const [minute, setMinute] = React.useState(initial.min);
  const [period, setPeriod] = React.useState<"AM" | "PM">(initial.period);

  const prevValue = React.useRef(value);
  React.useEffect(() => {
    if (value !== prevValue.current) {
      prevValue.current = value;
      const p = parseTime(value);
      setHour(p.h12);
      setMinute(p.min);
      setPeriod(p.period);
    }
  }, [value]);

  const minuteRef = React.useRef<HTMLInputElement>(null);

  const emit = (h: string, m: string, p: "AM" | "PM") => {
    const hNum = parseInt(h, 10);
    const mNum = parseInt(m, 10);
    if (!h || !m || isNaN(hNum) || isNaN(mNum)) return;
    if (hNum < 1 || hNum > 12 || mNum < 0 || mNum > 59) return;
    let h24 = hNum;
    if (p === "AM") { if (h24 === 12) h24 = 0; }
    else { if (h24 !== 12) h24 += 12; }
    onChange?.(`${String(h24).padStart(2, "0")}:${String(mNum).padStart(2, "0")}`);
  };

  const segmentClass = "w-8 bg-transparent outline-none text-center tabular-nums placeholder:text-muted-foreground/60";

  return (
    <div
      id={id}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid}
      className={cn(
        "flex h-11 w-full items-center border border-input bg-transparent px-3 text-sm transition-colors rounded-lg focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20 cursor-text",
        ariaInvalid && "border-destructive ring-2 ring-destructive/20",
        className
      )}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) onBlur?.();
      }}
    >
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        placeholder="12"
        value={hour}
        maxLength={2}
        className={segmentClass}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, "");
          const n = parseInt(v, 10);
          if (v === "" || (n >= 1 && n <= 12)) {
            setHour(v);
            emit(v, minute, period);
            if (v.length === 2 || (n >= 2 && n <= 9)) {
              minuteRef.current?.focus();
              minuteRef.current?.select();
            }
          }
        }}
        onBlur={() => {
          const n = parseInt(hour, 10);
          if (!isNaN(n) && n >= 1 && n <= 12) setHour(String(n));
        }}
      />
      <span className="text-muted-foreground select-none mx-0.5">:</span>
      <input
        ref={minuteRef}
        type="text"
        inputMode="numeric"
        placeholder="00"
        value={minute}
        maxLength={2}
        className={segmentClass}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, "");
          const n = parseInt(v, 10);
          if (v === "" || (n >= 0 && n <= 59)) {
            setMinute(v);
            emit(hour, v, period);
          }
        }}
        onBlur={() => {
          const n = parseInt(minute, 10);
          if (!isNaN(n)) setMinute(String(n).padStart(2, "0"));
        }}
      />
      <select
        value={period}
        onChange={(e) => {
          const p = e.target.value as "AM" | "PM";
          setPeriod(p);
          emit(hour, minute, p);
        }}
        className="ml-2 bg-transparent outline-none cursor-pointer text-sm"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
});

// ─── Section Header ───────────────────────────────────────────────────────────

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

// ─── Schema ───────────────────────────────────────────────────────────────────

const formSchema = z.object({
  employeeName: z.string().min(2, "Name must be at least 2 characters"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  didBorrow: z.enum(["yes", "no"]).default("no"),
  borrowedAmount: z.coerce.number().min(0).optional(),
  borrowedNotes: z.string().optional(),
  jobDescription: z.string().min(5, "Description must be at least 5 characters"),
  customerName: z.string().min(2, "Customer name is required"),
  customerPaid: z.boolean().default(false),
  additionalNotes: z.string().optional(),
});

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const createEntry = useMutation(api.entries.create);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeName: "",
      startTime: "",
      endTime: "",
      didBorrow: "no",
      borrowedAmount: 0,
      borrowedNotes: "",
      jobDescription: "",
      customerName: "",
      customerPaid: false,
      additionalNotes: "",
    },
  });

  const didBorrow = form.watch("didBorrow");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await createEntry({
        employeeName: values.employeeName,
        startTime: values.startTime,
        endTime: values.endTime,
        borrowedAmount: values.didBorrow === "yes" ? (values.borrowedAmount ?? 0) : 0,
        borrowedNotes: values.didBorrow === "yes" ? (values.borrowedNotes ?? "") : "",
        jobDescription: values.jobDescription,
        customerName: values.customerName,
        customerPaid: values.customerPaid,
        additionalNotes: values.additionalNotes ?? "",
        entryDate: format(new Date(), "yyyy-MM-dd"),
        payment: 0,
      });
      toast.success("Entry submitted successfully!");
      form.reset({
        ...form.getValues(),
        didBorrow: "no",
        jobDescription: "",
        customerName: "",
        customerPaid: false,
        additionalNotes: "",
        borrowedAmount: 0,
        borrowedNotes: "",
      });
    } catch (error) {
      toast.error("Failed to submit entry. Please try again.");
      console.error(error);
    }
  }

  return (
    <div className="container mx-auto max-w-xl px-4 py-6 pb-28">
      <Card className="shadow-sm border border-border/60">
        {/* Card Header */}
        <CardHeader className="pb-6 pt-6 px-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold">Daily Job Log</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground pl-11">
                Record your work details for today.
              </p>
            </div>
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full shrink-0 mt-1">
              {format(new Date(), "MMM d")}
            </span>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-6">
          <Form {...form}>
            <form id="daily-log" onSubmit={form.handleSubmit(onSubmit)} className="space-y-7">

              {/* Employee */}
              <div className="space-y-3">
                <SectionHeader icon={User} label="Employee" />
                <FormField
                  control={form.control}
                  name="employeeName"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-muted-foreground">Your Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Full name" className="h-11 rounded-lg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t border-border/50" />

              {/* Working Hours */}
              <div className="space-y-3">
                <SectionHeader icon={Clock} label="Working Hours" />
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-muted-foreground">Start</FormLabel>
                        <FormControl>
                          <TimeInput {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-muted-foreground">End</FormLabel>
                        <FormControl>
                          <TimeInput {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="border-t border-border/50" />

              {/* Job Details */}
              <div className="space-y-3">
                <SectionHeader icon={UserCircle} label="Job Details" />
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-muted-foreground">Customer Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Customer's name" className="h-11 rounded-lg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="jobDescription"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-muted-foreground">Work Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the work performed today..."
                          className="min-h-[90px] resize-none rounded-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerPaid"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormControl>
                        <label className={cn(
                          "flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors",
                          field.value
                            ? "border-green-500/40 bg-green-500/5"
                            : "border-border/60 hover:bg-muted/40"
                        )}>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                          />
                          <div className="space-y-0.5 leading-none">
                            <div className="flex items-center gap-1.5 text-sm font-semibold">
                              <CheckCircle2 className={cn("h-4 w-4", field.value ? "text-green-600" : "text-muted-foreground")} />
                              Payment Collected
                            </div>
                            <p className="text-xs text-muted-foreground font-normal">
                              Check if the customer paid in full.
                            </p>
                          </div>
                        </label>
                      </FormControl>
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

              <div className="border-t border-border/50" />

              {/* Notes */}
              <div className="space-y-3">
                <SectionHeader icon={FileText} label="Additional Notes" />
                <FormField
                  control={form.control}
                  name="additionalNotes"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Any issues or extra details to report... (optional)"
                          className="min-h-[70px] resize-none rounded-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Sticky submit bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-border/60 px-4 py-3">
        <div className="container mx-auto max-w-xl">
          <Button
            type="submit"
            form="daily-log"
            className="w-full h-12 text-base font-semibold rounded-xl"
          >
            Submit Daily Report
          </Button>
        </div>
      </div>

      <div className="mt-6 text-center pb-4">
        <Link
          to="/login"
          className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          Management Portal
        </Link>
      </div>
    </div>
  );
}
