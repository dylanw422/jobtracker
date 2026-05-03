import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  jobEntries: defineTable({
    employeeName: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    borrowedAmount: v.number(),
    borrowedNotes: v.string(),
    jobDescription: v.string(),
    customerName: v.string(),
    customerPaid: v.boolean(),
    additionalNotes: v.string(),
    entryDate: v.string(), // ISO date YYYY-MM-DD
    payment: v.number(),
  }).index("by_date", ["entryDate"]),
  settings: defineTable({
    key: v.string(), // e.g., "admin_password"
    value: v.any(),
  }).index("by_key", ["key"]),
});
