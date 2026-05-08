import type { PermissionLevel, UserRole } from "@/lib/enums";
import type { Result } from "@/lib/result";

export type { Result };

export type EntityId = string;
export type ISODateTime = string;

export interface AppUser {
  id: EntityId;
  email: string;
  name: string | null;
  avatarUrl?: string | null;
  createdAt?: ISODateTime;
}

export interface OrganizationSummary {
  id: EntityId;
  name: string;
  slug: string;
  plan?: string;
  logoUrl?: string | null;
}

export interface Workspace {
  id: EntityId;
  organizationId: EntityId;
  name: string;
  role: UserRole;
  permissionLevel: PermissionLevel;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
