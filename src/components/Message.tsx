'use client';

import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { ComponentPropsWithoutRef } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

type CodeComponentProps = ComponentPropsWithoutRef<'code'> & {
  inline?: boolean;
};

export function Message({ role, content }: ChatMessage) {
  const components: Components = {
    code({ inline, className, children, ...props }: CodeComponentProps) {
      return (
        <code
          className={`font-sans ${className ?? ''} ${
            inline ? 'rounded bg-base-300/50 px-1' : 'block rounded bg-base-300/50 p-2'
          }`}
          {...props}
        >
          {children}
        </code>
      );
    },
  };

  return (
    <div className={`chat ${role === 'user' ? 'chat-end' : 'chat-start'}`}>
      <div className={`chat-bubble ${role === 'user' ? 'chat-bubble-primary' : 'bg-base-100'}`}>
        <ReactMarkdown components={components}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
