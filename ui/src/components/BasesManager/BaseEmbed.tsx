/**
 * BaseEmbed Component
 * 
 * Renders base data as HTML table for markdown embedding
 */

import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { basesService, BaseEmbedOptions } from '../../services/bases-service';

export interface BaseEmbedProps {
  basePath: string;
  options?: BaseEmbedOptions;
  preview?: boolean;
}

export const BaseEmbed: React.FC<BaseEmbedProps> = ({
  basePath,
  options,
  preview = false
}) => {
  const [html, setHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEmbed();
  }, [basePath, options]);

  const loadEmbed = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const embedHtml = await basesService.getBaseEmbed(basePath, options);
      setHtml(embedHtml);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load base embed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-400 p-4">
        <AlertCircle className="w-5 h-5" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="base-embed-container">
      <div
        dangerouslySetInnerHTML={{ __html: html }}
        className="base-embed-content"
      />
      <style>{`
        .base-embed-container {
          width: 100%;
          overflow-x: auto;
        }
        .base-embed-content table.base-embed {
          width: 100%;
          border-collapse: collapse;
          background: #1f2937;
          color: #f3f4f6;
        }
        .base-embed-content table.base-embed thead {
          background: #111827;
        }
        .base-embed-content table.base-embed th {
          padding: 0.75rem;
          text-align: left;
          font-weight: 600;
          border-bottom: 1px solid #374151;
          color: #d1d5db;
        }
        .base-embed-content table.base-embed td {
          padding: 0.75rem;
          border-bottom: 1px solid #374151;
          color: #f3f4f6;
        }
        .base-embed-content table.base-embed tbody tr:hover {
          background: #374151;
        }
        .base-embed-content table.base-embed tbody tr:last-child td {
          border-bottom: none;
        }
      `}</style>
    </div>
  );
};

/**
 * Parse markdown embed syntax: ![[base-file.base|options]]
 */
export function parseBaseEmbedSyntax(markdown: string): Array<{
  fullMatch: string;
  basePath: string;
  options?: BaseEmbedOptions;
}> {
  const regex = /!\[\[([^\]]+)\]\]/g;
  const matches: Array<{ fullMatch: string; basePath: string; options?: BaseEmbedOptions }> = [];
  let match;

  while ((match = regex.exec(markdown)) !== null) {
    const fullMatch = match[0];
    const content = match[1];
    
    // Parse options: base-file.base|limit=10|fields=name,date|sort=date:desc
    const parts = content.split('|');
    const basePath = parts[0].trim();
    const options: BaseEmbedOptions = {};

    for (let i = 1; i < parts.length; i++) {
      const option = parts[i].trim();
      const [key, value] = option.split('=');

      switch (key) {
        case 'limit':
          options.limit = parseInt(value, 10);
          break;
        case 'fields':
          options.fields = value.split(',').map(f => f.trim());
          break;
        case 'sort':
          // Parse sort: field:direction
          const [field, direction] = value.split(':');
          if (!options.sort) options.sort = [];
          options.sort.push({
            field: field.trim(),
            direction: (direction?.trim() || 'asc') as 'asc' | 'desc'
          });
          break;
        case 'filter':
          // Parse filter: field:operator:value
          const filterParts = value.split(':');
          if (filterParts.length >= 3) {
            if (!options.filters) options.filters = [];
            options.filters.push({
              field: filterParts[0].trim(),
              operator: filterParts[1].trim() as any,
              value: filterParts.slice(2).join(':').trim()
            });
          }
          break;
      }
    }

    matches.push({ fullMatch, basePath, options });
  }

  return matches;
}

/**
 * Replace base embeds in markdown with rendered HTML
 */
export async function renderBaseEmbedsInMarkdown(
  markdown: string,
  onRender: (basePath: string, options?: BaseEmbedOptions) => Promise<string>
): Promise<string> {
  const embeds = parseBaseEmbedSyntax(markdown);
  let result = markdown;

  for (const embed of embeds) {
    try {
      const html = await onRender(embed.basePath, embed.options);
      // Replace markdown syntax with HTML
      result = result.replace(embed.fullMatch, html);
    } catch (err) {
      // Keep original syntax on error
      console.error('Failed to render base embed:', err);
    }
  }

  return result;
}
