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

// ─── Time Scroll Picker ───────────────────────────────────────────────────────

const ITEM_H = 44;
const HOURS   = ["1","2","3","4","5","6","7","8","9","10","11","12"];
const MINUTES = ["00","05","10","15","20","25","30","35","40","45","50","55"];
const PERIODS = ["AM","PM"];

function parseTimePicker(value: string): { h12: string; min: string; period: "AM" | "PM" } {
  const fallback = { h12: "12", min: "00", period: "AM" as const };
  if (!value) return fallback;
  const [hs, ms] = value.split(":");
  const h24 = parseInt(hs, 10);
  const m   = parseInt(ms, 10);
  if (isNaN(h24) || isNaN(m)) return fallback;
  const rounded = Math.round(m / 5) * 5;
  const minStr  = String(rounded >= 60 ? 0 : rounded).padStart(2, "0");
  return {
    h12: String(h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24),
    min: minStr,
    period: h24 >= 12 ? "PM" : "AM",
  };
}

function ScrollColumn({
  items,
  selected,
  onSelect,
  className,
}: {
  items: string[];
  selected: string;
  onSelect: (val: string) => void;
  className?: string;
}) {
  const ref        = React.useRef<HTMLDivElement>(null);
  const settling   = React.useRef(false);
  const settleTimer = React.useRef<ReturnType<typeof setTimeout>>();

  // Set position synchronously on first paint
  React.useLayoutEffect(() => {
    const idx = Math.max(0, items.indexOf(selected));
    if (ref.current) ref.current.scrollTop = idx * ITEM_H;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Respond to external value changes (form reset)
  const prevSelected = React.useRef(selected);
  React.useEffect(() => {
    if (selected === prevSelected.current || settling.current) return;
    prevSelected.current = selected;
    const idx = items.indexOf(selected);
    if (idx >= 0 && ref.current) {
      ref.current.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
    }
  }, [selected, items]);

  const handleScroll = () => {
    if (!ref.current) return;
    settling.current = true;
    clearTimeout(settleTimer.current);

    const idx    = Math.round(ref.current.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(idx, items.length - 1));
    const val    = items[clamped];
    if (val !== prevSelected.current) {
      prevSelected.current = val;
      onSelect(val);
    }

    settleTimer.current = setTimeout(() => { settling.current = false; }, 300);
  };

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      className={cn(
        "overflow-y-scroll overflow-x-hidden overscroll-contain snap-y snap-mandatory",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      style={{ height: ITEM_H * 3 }}
    >
      {/* top spacer so first item can centre */}
      <div style={{ height: ITEM_H }} aria-hidden />
      {items.map((item) => (
        <div
          key={item}
          onClick={() => {
            const idx = items.indexOf(item);
            ref.current?.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
            prevSelected.current = item;
            onSelect(item);
          }}
          className={cn(
            "flex items-center justify-center snap-center select-none transition-all duration-150 text-sm cursor-pointer",
            item === selected
              ? "text-foreground font-semibold scale-105"
              : "text-muted-foreground/40",
          )}
          style={{ height: ITEM_H }}
        >
          {item}
        </div>
      ))}
      {/* bottom spacer so last item can centre */}
      <div style={{ height: ITEM_H }} aria-hidden />
    </div>
  );
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
  ref,
) {
  const parsed = parseTimePicker(value);
  const [hour,   setHour]   = React.useState(parsed.h12);
  const [minute, setMinute] = React.useState(parsed.min);
  const [period, setPeriod] = React.useState<"AM" | "PM">(parsed.period);

  // Sync on external value change (form reset)
  const prevValue = React.useRef(value);
  React.useEffect(() => {
    if (value === prevValue.current) return;
    prevValue.current = value;
    const p = parseTimePicker(value);
    setHour(p.h12);
    setMinute(p.min);
    setPeriod(p.period);
  }, [value]);

  const emit = (h: string, m: string, p: "AM" | "PM") => {
    const hNum = parseInt(h, 10);
    const mNum = parseInt(m, 10);
    if (isNaN(hNum) || isNaN(mNum)) return;
    let h24 = hNum;
    if (p === "AM") { if (h24 === 12) h24 = 0; }
    else            { if (h24 !== 12) h24 += 12; }
    onChange?.(`${String(h24).padStart(2, "0")}:${String(mNum).padStart(2, "0")}`);
  };

  return (
    <div
      id={id}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid}
      className={cn(
        "relative flex w-full overflow-hidden rounded-xl border border-input bg-background",
        ariaInvalid && "border-destructive",
        className,
      )}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) onBlur?.();
      }}
    >
      {/* Selection band */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 border-y border-border/60 bg-muted/50 z-10"
        style={{ height: ITEM_H }} />
      {/* Gradient fades */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-background via-background/80 to-transparent"
        style={{ height: ITEM_H }} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-background via-background/80 to-transparent"
        style={{ height: ITEM_H }} />

      {/* Hours */}
      <ScrollColumn
        items={HOURS}
        selected={hour}
        onSelect={(h) => { setHour(h); emit(h, minute, period); }}
        className="flex-1"
      />

      {/* Separator */}
      <div className="pointer-events-none z-20 flex items-center justify-center text-muted-foreground font-bold text-base select-none px-0.5">
        :
      </div>

      {/* Minutes */}
      <ScrollColumn
        items={MINUTES}
        selected={minute}
        onSelect={(m) => { setMinute(m); emit(hour, m, period); }}
        className="flex-1"
      />

      {/* Divider */}
      <div className="z-20 my-3 w-px bg-border/50 self-stretch" />

      {/* AM / PM */}
      <ScrollColumn
        items={PERIODS}
        selected={period}
        onSelect={(p) => { const pp = p as "AM" | "PM"; setPeriod(pp); emit(hour, minute, pp); }}
        className="w-14"
      />

      {/* Hidden input so forwardRef lands somewhere */}
      <input ref={ref} type="hidden" value={value} readOnly />
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
