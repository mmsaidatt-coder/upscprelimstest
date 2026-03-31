import { redirect } from "next/navigation";

/**
 * /app/analytics → redirect to the aggregate subject view.
 * The old tab-based UI is replaced by per-subject deep-link pages.
 */
export default function AppAnalyticsPage() {
  redirect("/app/analytics/all");
}
