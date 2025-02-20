"use client";

import ReactMarkdown from "react-markdown";
import { Components } from "react-markdown/lib/ast-to-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface CodeProps {
  node: any;
  inline: boolean;
  className: string;
  children: React.ReactNode[];
}

export function Message({ role, content }: ChatMessage) {
  const components: Components = {
    code: ({ inline, className, children, ...props }: CodeProps) => {
      return (
        <code
          className={`font-sans ${className ?? ""} ${
            inline
              ? "bg-base-300/50 rounded px-1"
              : "block bg-base-300/50 p-2 rounded"
          }`}
          {...props}
        >
          {children}
        </code>
      );
    },
  };

  return (
    <div className={`chat ${role === "user" ? "chat-end" : "chat-start"}`}>
      <div
        className={`chat-bubble ${
          role === "user" ? "chat-bubble-primary" : "bg-base-100"
        }`}
      >
        <ReactMarkdown components={components}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
