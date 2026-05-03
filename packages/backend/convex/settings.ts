import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getPassword = query({
  args: {},
  handler: async (ctx) => {
    const setting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "admin_password"))
      .unique();
    return setting?.value ?? "admin123"; // Default if not set
  },
});

export const updatePassword = mutation({
  args: {
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "admin_password"))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { value: args.newPassword });
    } else {
      await ctx.db.insert("settings", {
        key: "admin_password",
        value: args.newPassword,
      });
    }
  },
});
