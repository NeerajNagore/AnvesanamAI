import type { IncomingMessage, ServerResponse } from "http";

export interface VercelRequest extends IncomingMessage {
  query: Record<string, string | string[] | undefined>;
  body: any;
  cookies: Record<string, string>;
}

export interface VercelResponse extends ServerResponse {
  status: (statusCode: number) => VercelResponse;
  json: (data: any) => VercelResponse;
  send: (body: any) => VercelResponse;
}

export interface Source {
  id: number;
  title: string;
  url: string;
  domain: string;
  snippet: string;
  publishedAt?: string;
  _content?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  category: string;
  publishedAt: string;
  imageUrl?: string;
}

export interface ReportSection {
  heading: string;
  body: string;
}

export interface ResearchReport {
  id: string;
  title: string;
  query: string;
  summary: string;
  keyFindings: string[];
  sections: ReportSection[];
  sources: Source[];
  depth: string;
  createdAt: string;
  demo: boolean;
}
