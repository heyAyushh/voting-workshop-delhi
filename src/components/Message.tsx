"use client";

import ReactMarkdown from "react-markdown";

interface MessageProps {
  role: "user" | "assistant";
  content: string;
}

export function Message({ role, content }: MessageProps) {
  return (
    <div className={`chat ${role === "user" ? "chat-end" : "chat-start"}`}>
      <div className={`chat-bubble ${
        role === "user" 
          ? "chat-bubble-primary" 
          : "bg-base-100"
      }`}>
        <ReactMarkdown
          components={{
            code: ({ node, inline, className, children, ...props }) => {
              return (
                <code
                  className={`font-sans ${className} ${
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
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
