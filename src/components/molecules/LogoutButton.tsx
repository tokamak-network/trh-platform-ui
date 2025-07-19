import { Button } from "@/design-system";
import { useAuthContext } from "@/providers";

interface LogoutButtonProps {
  className?: string;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({ className }) => {
  const { logout, isAuthenticated } = useAuthContext();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Button variant="outline" onClick={logout} className={className}>
      Logout
    </Button>
  );
};
