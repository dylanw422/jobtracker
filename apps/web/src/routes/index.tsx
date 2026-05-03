import { api } from "@jobtracker/backend/convex/_generated/api";
import { Button } from "@jobtracker/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { RadioGroup, RadioGroupItem } from "@jobtracker/ui/components/radio-group";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import * as React from "react";
import { format } from "date-fns";
import { Clock, User, Landmark, Briefcase, UserCircle, CheckCircle2, Notebook } from "lucide-react";
import { cn } from "@jobtracker/ui/lib/utils";

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

  // Sync internal state when the form resets the value externally
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
        "flex h-10 w-full items-center border border-input bg-transparent px-3 text-sm transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/50 cursor-text",
        ariaInvalid && "border-destructive ring-1 ring-destructive/20",
        className
      )}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) onBlur?.();
      }}
    >
      {/* Hour */}
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
            // Auto-advance: hours 2-9 can only be 1 digit; length 2 is always done
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
      {/* Minute */}
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
      {/* AM/PM */}
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
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card className="border-none shadow-lg ring-1 ring-foreground/5">
        <CardHeader className="space-y-1 pb-8">
          <div className="flex items-center gap-2 text-primary">
            <Briefcase className="h-6 w-6" />
            <CardTitle className="text-2xl font-bold tracking-tight">Daily Job Log</CardTitle>
          </div>
          <CardDescription className="text-base">
            Record your work details for today.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Employee Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  <User className="h-4 w-4" />
                  Employee Information
                </div>
                <FormField
                  control={form.control}
                  name="employeeName"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Your Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your full name"
                          className="h-10 text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Time Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  <Clock className="h-4 w-4" />
                  Working Hours
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
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
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <TimeInput {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Borrowing Section */}
              <div className="space-y-4 rounded-xl bg-muted/30 p-4 ring-1 ring-foreground/5 transition-all">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  <Landmark className="h-4 w-4" />
                  Borrowing
                </div>
                <FormField
                  control={form.control}
                  name="didBorrow"
                  render={({ field }: { field: any }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Did you borrow any money today?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex gap-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="no" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">No</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="yes" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">Yes</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {didBorrow === "yes" && (
                  <div className="grid gap-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <FormField
                      control={form.control}
                      name="borrowedAmount"
                      render={({ field }: { field: any }) => (
                        <FormItem>
                          <FormLabel>Amount Borrowed ($)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0.00" className="h-10" {...field} />
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
                          <FormLabel>Reason for Borrowing</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="What was the money for?"
                              className="h-10"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Customer & Job Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  <UserCircle className="h-4 w-4" />
                  Job Details
                </div>
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter customer's name" className="h-10" {...field} />
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
                      <FormLabel>Work Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What work was performed today?"
                          className="min-h-[100px] resize-none"
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
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border bg-background p-4 shadow-sm transition-colors hover:bg-accent/5">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Payment Collected
                        </FormLabel>
                        <FormDescription className="text-xs">
                          Check this only if the customer has paid in full.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Notes Section */}
              <div className="space-y-4 pb-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  <Notebook className="h-4 w-4" />
                  Final Notes
                </div>
                <FormField
                  control={form.control}
                  name="additionalNotes"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Additional Comments (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any issues or extra details to report..."
                          className="min-h-[80px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
              >
                Submit Daily Report
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <div className="mt-8 text-center flex flex-col gap-2 items-center text-xs text-muted-foreground pb-12">
        <p>© {new Date().getFullYear()} Job Tracker App. All rights reserved.</p>
        <Link
          to="/login"
          className="hover:text-primary transition-colors underline underline-offset-4 decoration-muted-foreground/30"
        >
          Management Portal
        </Link>
      </div>
    </div>
  );
}
