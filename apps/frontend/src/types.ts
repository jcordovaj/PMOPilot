/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  epicId?: string;
  storyId?: string;
  assignedTo?: string;
}

export interface Story {
  id: string;
  title: string;
  description: string;
  epicId: string;
  status: 'todo' | 'in_progress' | 'done';
}

export interface Epic {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
}

export interface ProjectState {
  id: string;
  name: string;
  description: string;
  repositoryUrl?: string;
  status: 'uninitialized' | 'bootstrapping' | 'active';
  epics: Epic[];
  stories: Story[];
  tasks: Task[];
  members: string[];
}

export interface Adr {
  id: string;
  title: string;
  status: 'proposed' | 'accepted' | 'rejected' | 'superseded';
  date: string;
  author: string;
  context: string;
  decision: string;
  consequences: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  proposedAction?: {
    type: string;
    data: any;
    executed?: boolean;
  };
}

export interface PrCheck {
  id: string;
  name: string;
  status: 'pending' | 'success' | 'failed';
  message: string;
}

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  branch: string;
  author: string;
  status: 'open' | 'merged' | 'closed';
  codeChanges: string;
  checks: PrCheck[];
  aiReview?: string;
}

export type UserRole = "leader" | "tester" | "guest";

export interface SendGridNotification {
  id: string;
  subject: string;
  to: string;
  time: string;
  status: "sent" | "pending";
  body: string;
  templateId: string;
}

