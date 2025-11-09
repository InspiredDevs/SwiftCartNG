import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function Settings() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your store settings</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment Integration</CardTitle>
            <CardDescription>
              Connect payment gateways for online transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4 p-4 border rounded-lg bg-muted/50">
              <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Coming Soon</p>
                <p className="text-sm text-muted-foreground">
                  Paystack and Flutterwave integration will be available soon.
                  This will enable secure online payments for your customers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>WhatsApp Notifications</CardTitle>
            <CardDescription>
              Automated order notifications via WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4 p-4 border rounded-lg bg-muted/50">
              <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Coming Soon</p>
                <p className="text-sm text-muted-foreground">
                  Automatic WhatsApp notifications for order confirmations and status updates
                  will be integrated in the next update.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Store Information</CardTitle>
            <CardDescription>
              Basic store details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Store Name</span>
              <span className="font-medium">SwiftCart NG</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">support@swiftcart.ng</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium">+234 800 000 0000</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Location</span>
              <span className="font-medium">Lagos, Nigeria</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
