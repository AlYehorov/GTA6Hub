import { MapExperience } from "@/components/map/map-experience";
import { getLeonidaMarkers } from "@/lib/map/fetch-leonida-markers";
import { getPublishedMapPoints } from "@/lib/map/queries";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "GTA 6 Interactive Map — State of Leonida",
  description:
    "Explore the full GTA VI community map of Leonida and Vice City — landmarks, trailer locations, and GTA6Hub guide points on the same Leonida tiles.",
  path: "/map",
});

export default async function MapPage() {
  const [{ markers: communityMarkers, layers: communityLayers }, hubPoints] = await Promise.all([
    getLeonidaMarkers(),
    getPublishedMapPoints(),
  ]);

  return (
    <MapExperience
      communityMarkers={communityMarkers}
      communityLayers={communityLayers}
      hubPoints={hubPoints}
    />
  );
}
