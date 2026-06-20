import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ArticleContentProps {
  content: string;
}

export function ArticleContent({ content }: ArticleContentProps) {
  return (
    <article className="article-prose mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </article>
  );
}
