import { MapExperience } from "@/components/map/map-experience";
import { createPageMetadata } from "@/lib/metadata";
import { getPublishedMapPoints } from "@/lib/map/queries";

export const metadata = createPageMetadata({
  title: "GTA 6 Interactive Map — State of Leonida",
  description:
    "Explore the full GTA VI community map of Leonida and Vice City — same interactive map as State of Leonida, plus GTA6Hub guide locations.",
  path: "/map",
});

export default async function MapPage() {
  const points = await getPublishedMapPoints();

  return <MapExperience points={points} />;
}
