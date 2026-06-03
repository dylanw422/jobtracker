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
    customerAddress: v.optional(v.string()),
    customerStreet: v.optional(v.string()),
    customerCity: v.optional(v.string()),
    customerState: v.optional(v.string()), // always "LA" for new entries
    customerZip: v.optional(v.string()),
    customerPaid: v.boolean(),
    additionalNotes: v.string(),
    entryDate: v.string(), // ISO date YYYY-MM-DD
    payment: v.number(),
    userId: v.optional(v.string()),
  }).index("by_date", ["entryDate"]),
  settings: defineTable({
    key: v.string(), // e.g., "admin_password"
    value: v.any(),
  }).index("by_key", ["key"]),
  users: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    username: v.string(),
  }).index("by_username", ["username"]),
  clockSessions: defineTable({
    userId: v.string(),
    clockInTime: v.number(),
    clockOutTime: v.optional(v.number()),
  }).index("by_user", ["userId"]),
});
