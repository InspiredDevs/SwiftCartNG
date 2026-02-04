import { Clock, Store } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import LogoutConfirmDialog from "@/components/LogoutConfirmDialog";
import { useState } from "react";

const PendingApproval = () => {
  const { signOut } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-4 border-b">
        <div className="container mx-auto flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-semibold rounded">
              SELLER
            </div>
            <Store className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">SwiftCart NG</span>
          </div>
        </div>
      </header>
      
      <div className="flex-1 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
            <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-2xl">Account Pending Approval</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your seller account is currently under review. Our team will verify your details and approve your account within 24-48 hours.
          </p>
          <p className="text-sm text-muted-foreground">
            Once approved, you'll be able to access your seller dashboard and start listing products.
          </p>
          <Button 
            variant="outline" 
            onClick={() => setShowLogoutDialog(true)}
            className="mt-4"
          >
            Logout
          </Button>
        </CardContent>
      </Card>

      </div>

      <LogoutConfirmDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        onConfirm={handleLogout}
      />
    </div>
  );
};

export default PendingApproval;
