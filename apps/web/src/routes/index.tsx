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
import { format } from "date-fns";
import { Clock, User, Landmark, Briefcase, UserCircle, CheckCircle2, Notebook } from "lucide-react";

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
                {/* 
                  FIX: Switched to flex layout with min-w-0 on the inputs.
                  min-w-0 overrides browser native minimum widths for time inputs 
                  ensuring they never stretch past their flex container.
                */}
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }: { field: any }) => (
                      <FormItem className="flex-1 w-full min-w-0">
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" className="h-10 w-full min-w-0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }: { field: any }) => (
                      <FormItem className="flex-1 w-full min-w-0">
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input type="time" className="h-10 w-full min-w-0" {...field} />
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
