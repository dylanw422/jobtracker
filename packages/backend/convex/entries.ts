import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    employeeName: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    borrowedAmount: v.number(),
    borrowedNotes: v.string(),
    jobDescription: v.string(),
    customerName: v.string(),
    customerAddress: v.optional(v.string()),
    customerPaid: v.boolean(),
    additionalNotes: v.string(),
    entryDate: v.string(),
    payment: v.number(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("jobEntries", args);
    return id;
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("jobEntries").collect();
  },
});

export const getByDate = query({
  args: {
    entryDate: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("jobEntries")
      .withIndex("by_date", (q) => q.eq("entryDate", args.entryDate))
      .collect();
  },
});

export const getByDateRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("jobEntries")
      .withIndex("by_date", (q) =>
        q.gte("entryDate", args.startDate).lte("entryDate", args.endDate)
      )
      .collect();
  },
});

export const updateEndTime = mutation({
  args: {
    id: v.id("jobEntries"),
    endTime: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { endTime: args.endTime });
  },
});

export const updatePayment = mutation({
  args: {
    id: v.id("jobEntries"),
    paidAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.id);
    if (!entry) throw new Error("Entry not found");
    await ctx.db.patch(args.id, { payment: args.paidAmount });
    return args.paidAmount;
  },
});

export const updateBilling = mutation({
  args: {
    id: v.id("jobEntries"),
    payment: v.number(),
    customerPaid: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      payment: args.payment,
      customerPaid: args.customerPaid,
    });
  },
});

export const updateBorrowed = mutation({
  args: {
    id: v.id("jobEntries"),
    borrowedAmount: v.number(),
    borrowedNotes: v.string(),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.id);
    if (!entry) throw new Error("Entry not found");
    await ctx.db.patch(args.id, {
      borrowedAmount: args.borrowedAmount,
      borrowedNotes: args.borrowedNotes,
    });
  },
});
