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
    customerPaid: v.boolean(),
    additionalNotes: v.string(),
    entryDate: v.string(),
    payment: v.number(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("jobEntries", args);
    return id;
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
