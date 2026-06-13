export interface AttachmentInfo {
  filename:     string;
  pages:        number;
  chunks:       number;
  summary?:     string;
  suggestions?: string[];
}

export interface Citation {
  source:   string;
  page_num: number;
  snippet?: string;
}

export interface Message {
  id:           string;
  role:         'human' | 'assistant' | 'attachment';
  content:      string;
  sources?:     Citation[];
  isStreaming?: boolean;
  isThinking?:  boolean;
  attachment?:  AttachmentInfo;
}

export interface UploadedDoc {
  filename:    string;
  pages:       number;
  chunks:      number;
  summary:     string;
  suggestions: string[];
}