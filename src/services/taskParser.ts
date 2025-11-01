import { Task } from '../types';

interface ParsedTask {
  title: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
}

export function parseBulkTaskInput(input: string): ParsedTask[] {
  const lines = input
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  return lines.map(line => parseSingleLine(line));
}

function parseSingleLine(line: string): ParsedTask {
  let title = line;
  let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
  const tags: string[] = [];

  // Remove common bullet points/numbering
  title = title.replace(/^[-*•]\s*/, '');
  title = title.replace(/^\d+[\.)]\s*/, '');

  // Detect priority markers
  const priorityPatterns = [
    { pattern: /\[urgent\]|\!{3,}|🔴/gi, priority: 'urgent' as const },
    { pattern: /\[high\]|\!{2}|🟠/gi, priority: 'high' as const },
    { pattern: /\[low\]|🟢/gi, priority: 'low' as const },
    { pattern: /\[medium\]/gi, priority: 'medium' as const },
  ];

  for (const { pattern, priority: p } of priorityPatterns) {
    if (pattern.test(title)) {
      priority = p;
      title = title.replace(pattern, '').trim();
      break;
    }
  }

  // Extract hashtags as tags
  const hashtagMatches = title.match(/#\w+/g);
  if (hashtagMatches) {
    tags.push(...hashtagMatches.map(tag => tag.substring(1)));
    title = title.replace(/#\w+/g, '').trim();
  }

  // Clean up extra spaces
  title = title.replace(/\s+/g, ' ').trim();

  return { title, priority, tags };
}

export function createTasksFromParsed(
  parsed: ParsedTask[],
  clientId: string
): Omit<Task, 'id' | 'createdAt'>[] {
  return parsed.map(({ title, priority, tags }) => ({
    clientId,
    title,
    description: undefined,
    priority: priority || 'medium',
    status: 'todo' as const,
    dueDate: undefined,
    completedAt: undefined,
    estimatedTime: undefined,
    actualTime: undefined,
    tags,
    notes: undefined,
  }));
}
