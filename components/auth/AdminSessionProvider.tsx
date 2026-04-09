"use client";

import { createContext, useContext } from "react";

const AdminSessionContext = createContext(false);

export function AdminSessionProvider({
  isAdmin,
  children,
}: {
  isAdmin: boolean;
  children: React.ReactNode;
}) {
  return <AdminSessionContext.Provider value={isAdmin}>{children}</AdminSessionContext.Provider>;
}

export function useAdminSessionFlag() {
  return useContext(AdminSessionContext);
}