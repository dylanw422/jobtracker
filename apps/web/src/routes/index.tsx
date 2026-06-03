import { api } from "@jobtracker/backend/convex/_generated/api";
import { Button } from "@jobtracker/ui/components/button";
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
import { cn } from "@jobtracker/ui/lib/utils";
import { LOUISIANA_CITIES, CITY_NAMES } from "@/data/louisiana-cities";

const formSchema = z.object({
  customerName: z.string().min(2, "Customer name is required"),
  customerStreet: z.string().min(3, "Street address is required"),
  customerCity: z.string().min(2, "City is required"),
  customerZip: z.string().regex(/^\d{5}$/, "Select a ZIP code"),
  didBorrow: z.enum(["yes", "no"]).default("no"),
  borrowedAmount: z.coerce.number().min(0).optional(),
  borrowedNotes: z.string().optional(),
});

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function toTitleCase(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── City Autocomplete ────────────────────────────────────────────────────────

function CityAutocomplete({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (city: string) => void;
  disabled: boolean;
}) {
  const [query, setQuery] = React.useState(value);
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const suggestions = React.useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return CITY_NAMES.filter((c) => c.toLowerCase().startsWith(q)).slice(0, 8);
  }, [query]);

  React.useEffect(() => {
    setQuery(value);
  }, [value]);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(city: string) {
    setQuery(city);
    onChange(city);
    setOpen(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    setOpen(true);
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={query}
        onChange={handleInputChange}
        onFocus={() => query.trim() && setOpen(true)}
        placeholder="Start typing a city..."
        className="h-11"
        disabled={disabled}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 rounded-lg border border-border/60 bg-background shadow-lg overflow-hidden">
          {suggestions.map((city) => (
            <button
              key={city}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(city)}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/60 transition-colors"
            >
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ZIP Select ───────────────────────────────────────────────────────────────

function ZipSelect({
  city,
  value,
  onChange,
  disabled,
}: {
  city: string;
  value: string;
  onChange: (zip: string) => void;
  disabled: boolean;
}) {
  const zips = LOUISIANA_CITIES[city] ?? [];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || zips.length === 0}
      className={cn(
        "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
        "disabled:cursor-not-allowed disabled:opacity-50"
      )}
    >
      <option value="">
        {zips.length === 0 ? "Select a city first" : "Select ZIP code"}
      </option>
      {zips.map((zip) => (
        <option key={zip} value={zip}>
          {zip}
        </option>
      ))}
    </select>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

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

  const [clockInTime, setClockInTime] = React.useState<number | null>(() => {
    const stored = localStorage.getItem("clock_in_time");
    return stored ? parseInt(stored, 10) : null;
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      customerStreet: "",
      customerCity: "",
      customerZip: "",
      didBorrow: "no",
      borrowedAmount: 0,
      borrowedNotes: "",
    },
  });

  const customerName = form.watch("customerName");
  const customerStreet = form.watch("customerStreet");
  const customerCity = form.watch("customerCity");
  const customerZip = form.watch("customerZip");
  const didBorrow = form.watch("didBorrow");
  const isClockedIn = clockInTime !== null;

  const canClockIn =
    customerName.trim().length >= 2 &&
    customerStreet.trim().length >= 3 &&
    LOUISIANA_CITIES[customerCity] !== undefined &&
    /^\d{5}$/.test(customerZip);

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
        customerName: toTitleCase(values.customerName),
        customerStreet: toTitleCase(values.customerStreet),
        customerCity: values.customerCity,
        customerState: "LA",
        customerZip: values.customerZip,
        customerPaid: false,
        additionalNotes: "",
        entryDate: format(new Date(), "yyyy-MM-dd"),
        payment: 0,
      });
      localStorage.setItem("clock_in_time", String(now));
      localStorage.setItem("current_entry_id", String(entryId));
      setClockInTime(now);
      toast.success("Clocked in!");
      form.reset({
        customerName: "",
        customerStreet: "",
        customerCity: "",
        customerZip: "",
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
    <div className="container mx-auto max-w-sm px-0 py-8 pb-36">
      {/* Greeting */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight">
          {greeting}, {user.firstName}!
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {format(new Date(), "EEEE, MMMM d")}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          {/* Customer section */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer</p>

            <FormField
              control={form.control}
              name="customerName"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Customer Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Customer's name" className="h-11" disabled={isClockedIn} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerStreet"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Street Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" className="h-11" disabled={isClockedIn} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerCity"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">City</FormLabel>
                  <FormControl>
                    <CityAutocomplete
                      value={field.value}
                      onChange={(city) => {
                        field.onChange(city);
                        form.setValue("customerZip", "");
                      }}
                      disabled={isClockedIn}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerZip"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">ZIP Code</FormLabel>
                  <FormControl>
                    <ZipSelect
                      city={customerCity}
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isClockedIn}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="border-t border-border/50" />

          {/* Borrowing section */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Borrowing</p>

            <FormField
              control={form.control}
              name="didBorrow"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Did you borrow money today?</FormLabel>
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
              <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                <FormField
                  control={form.control}
                  name="borrowedAmount"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Amount ($)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0.00" className="h-11" {...field} />
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
                      <FormLabel className="text-sm font-medium">Reason</FormLabel>
                      <FormControl>
                        <Input placeholder="What was the money for?" className="h-11" {...field} />
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

      {/* Sticky Clock In / Clock Out bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-border/60 px-0 pt-3 pb-12">
        <div className="container mx-auto max-w-sm">
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
