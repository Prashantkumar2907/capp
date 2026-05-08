export enum UserRole {
  Owner = "owner",
  Admin = "admin",
  Manager = "manager",
  Waiter = "waiter",
  Kitchen = "kitchen",
  Cashier = "cashier",
}

export enum Status {
  Idle = "idle",
  Loading = "loading",
  Success = "success",
  Error = "error",
  Empty = "empty",
}

export enum PermissionLevel {
  Read = "read",
  Write = "write",
  Manage = "manage",
  Owner = "owner",
}

export enum ThemeMode {
  Light = "light",
  Dark = "dark",
  System = "system",
}

export const userRoleValues = Object.values(UserRole);
export const statusValues = Object.values(Status);
export const permissionLevelValues = Object.values(PermissionLevel);
export const themeModeValues = Object.values(ThemeMode);
