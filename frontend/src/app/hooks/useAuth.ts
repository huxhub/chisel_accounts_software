import { useState, useEffect } from "react";
import { authService } from "../../services/authService";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    authService.getCurrentUser().then(user => {
      setIsAuthenticated(!!user);
      setAuthChecked(true);
    });
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    setIsAuthenticated,
    authChecked,
    handleLogout,
  };
}
