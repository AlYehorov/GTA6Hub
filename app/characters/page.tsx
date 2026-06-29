import { createEntityIndexPage } from "@/lib/entities/page-factory";

export const revalidate = 300;

const { generateMetadata, Page } = createEntityIndexPage("characters");

export { generateMetadata };
export default Page;
