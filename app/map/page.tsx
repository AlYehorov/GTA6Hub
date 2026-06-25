import { MapExperience } from "@/components/map/map-experience";
import { createPageMetadata } from "@/lib/metadata";
import { getPublishedMapPoints } from "@/lib/map/queries";

export const metadata = createPageMetadata({
  title: "GTA 6 Interactive Map",
  description:
    "Explore locations, secrets, districts, vehicles, wildlife and easter eggs across Leonida and Vice City.",
  path: "/map",
});

export default async function MapPage() {
  const points = await getPublishedMapPoints();

  return <MapExperience points={points} />;
}
