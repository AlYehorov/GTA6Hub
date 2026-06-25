import { createEntitySlugPage } from "@/lib/entities/page-factory";

const { generateMetadata, Page } = createEntitySlugPage("vehicles");

export { generateMetadata };
export default Page;
