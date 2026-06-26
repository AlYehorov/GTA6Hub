import { redirect } from "next/navigation";

/**
 * Legacy editorial calendar — redirects to the editorial dashboard.
 * Route kept for bookmarks and external links; UI lives at /admin/dashboard.
 */
export default function EditorialCalendarPage() {
  redirect("/admin/dashboard");
}
