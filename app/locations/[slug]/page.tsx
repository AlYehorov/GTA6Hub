import { createEntitySlugPage } from "@/lib/entities/page-factory";

const { generateMetadata, Page } = createEntitySlugPage("locations");

export { generateMetadata };
export default Page;
