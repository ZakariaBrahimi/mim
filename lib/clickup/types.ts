/** Minimal ClickUp API v2 shapes we rely on. */

export interface ClickUpCustomField {
  id: string;
  name: string;
  type: string;
  value?: unknown;
  type_config?: {
    options?: { id: string; name: string; orderindex?: number }[];
  };
}

export interface ClickUpStatus {
  status: string;
  color: string;
  type: string;
  orderindex: number;
}

export interface ClickUpUser {
  id: number;
  username: string;
  email?: string;
  color?: string;
  profilePicture?: string | null;
}

export interface ClickUpTask {
  id: string;
  name: string;
  text_content?: string;
  description?: string;
  status: ClickUpStatus;
  priority: { id: string; priority: string; color: string } | null;
  assignees: ClickUpUser[];
  start_date: string | null;
  due_date: string | null;
  date_created?: string;
  url: string;
  list: { id: string; name: string };
  space: { id: string; name: string };
  custom_fields: ClickUpCustomField[];
  tags?: { name: string }[];
}

export interface ClickUpList {
  id: string;
  name: string;
  space: { id: string; name: string };
  task_count?: number;
}

export interface ClickUpSpace {
  id: string;
  name: string;
}

export interface ClickUpMember {
  user: ClickUpUser;
}
