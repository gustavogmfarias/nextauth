import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

type UseCanParams = {
  permissions: string[];
  roles: string[];
};

export function useCan({ permissions, roles }: UseCanParams) {
  const { user, isAuthenticated } = useContext(AuthContext);

  if (!isAuthenticated) {
    return false;
  }

  if (permissions?.length > 0) {
    const hasAllPermissions = permissions.every();
  }
}
