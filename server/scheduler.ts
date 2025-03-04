import { storage } from "./storage";

const SCHEDULER_INTERVAL = 60000; // Check every minute

export function startScheduler() {
  // Initial check
  storage.publishScheduledPosts().catch(console.error);

  // Set up periodic checks
  setInterval(() => {
    storage.publishScheduledPosts().catch(console.error);
  }, SCHEDULER_INTERVAL);

  console.log("Post scheduler started - checking every minute");
}