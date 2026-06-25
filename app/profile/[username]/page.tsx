import { redirect } from "next/navigation";

interface LegacyProfileRedirectProps {
  params: Promise<{ username: string }>;
}

export default async function LegacyProfileRedirect({ params }: LegacyProfileRedirectProps) {
  const { username } = await params;
  redirect(`/u/${username}`);
}
