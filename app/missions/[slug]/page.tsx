import { createEntitySlugPage } from "@/lib/entities/page-factory";

const { generateMetadata, Page } = createEntitySlugPage("missions");

export { generateMetadata };
export default Page;
