import ReactMarkdown from "react-markdown";

import remarkGfm from "remark-gfm";

import remarkMath from "remark-math";

import rehypeRaw from "rehype-raw";

import rehypeKatex from "rehype-katex";

import "katex/dist/katex.min.css";

import CodeBlock from "../../../../shared/components/CodeBlock";

export default function MessageContent({
  message,
}) {
  // ====================================================
  // PREPROCESS AI OUTPUT
  // Fix mixed Markdown + LaTeX formatting
  // ====================================================

  const formattedMessage = String(message || "")
    // Convert <u>...</u> into Markdown bold
    .replace(
      /<u>(.*?)<\/u>/gs,
      "**$1**"
    )

    // Normalize display LaTeX blocks
    .replace(
      /\$\$([\s\S]*?)\$\$/g,
      (_, content) => `\n\n$$${content}$$\n\n`
    )

    // Keep horizontal rules separated from headings
    .replace(
      /(---)\s*(#{1,6}\s)/g,
      "$1\n\n$2"
    )

    // Prevent excessive blank lines
    .replace(
      /\n{3,}/g,
      "\n\n"
    )

    .trim();

  return (
    <div className="prose prose-invert max-w-none prose-headings:font-bold prose-headings:text-white prose-p:text-gray-200 prose-p:leading-8 prose-li:text-gray-200 prose-strong:text-white prose-a:text-violet-400 prose-blockquote:border-violet-500 prose-blockquote:text-gray-300">
      <ReactMarkdown
        remarkPlugins={[
          remarkGfm,
          remarkMath,
        ]}
        rehypePlugins={[
          rehypeRaw,
          rehypeKatex,
        ]}
        components={{
          code({
            className,
            children,
          }) {
            const language =
              /language-(\w+)/.exec(
                className || ""
              )?.[1];

            const value = String(
              children
            ).replace(/\n$/, "");

            const isBlock =
              value.includes("\n") ||
              Boolean(language);

            if (isBlock) {
              return (
                <CodeBlock
                  language={language}
                  value={value}
                />
              );
            }

            return (
              <code className="rounded bg-slate-800 px-2 py-1 text-pink-300">
                {children}
              </code>
            );
          },

          table({ children }) {
            return (
              <div className="my-6 overflow-x-auto rounded-xl border border-slate-700">
                <table className="w-full border-collapse">
                  {children}
                </table>
              </div>
            );
          },

          th({ children }) {
            return (
              <th className="border border-slate-700 bg-slate-800 p-3 text-left">
                {children}
              </th>
            );
          },

          td({ children }) {
            return (
              <td className="border border-slate-700 p-3">
                {children}
              </td>
            );
          },
        }}
      >
        {formattedMessage}
      </ReactMarkdown>
    </div>
  );
}