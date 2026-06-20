import { getAdminUser } from "@/lib/auth/admin";
import { AdminSignOutButton } from "@/components/admin/admin-sign-out-button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAdminUser();

  return (
    <>
      {user && (
        <div className="fixed right-4 top-20 z-40 sm:right-6 lg:right-8">
          <AdminSignOutButton email={user.email} />
        </div>
      )}
      {children}
    </>
  );
}
