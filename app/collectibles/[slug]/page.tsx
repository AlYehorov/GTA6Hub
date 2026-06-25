import { createEntitySlugPage } from "@/lib/entities/page-factory";

const { generateMetadata, Page } = createEntitySlugPage("collectibles");

export { generateMetadata };
export default Page;
