import { createEntitySlugPage } from "@/lib/entities/page-factory";

const { generateMetadata, Page } = createEntitySlugPage("animals");

export { generateMetadata };
export default Page;
