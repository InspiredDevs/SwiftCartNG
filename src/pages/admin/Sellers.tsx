import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle, XCircle } from 'lucide-react';

interface SellerStore {
  id: string;
  user_id: string;
  store_name: string;
  store_description: string | null;
  is_approved: boolean;
  created_at: string;
}

export default function Sellers() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sellers, setSellers] = useState<SellerStore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/admin/login');
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchSellers();
    }
  }, [isAdmin]);

  const fetchSellers = async () => {
    try {
      const { data, error } = await supabase
        .from('seller_stores')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSellers(data || []);
    } catch (error) {
      console.error('Error fetching sellers:', error);
      toast.error('Failed to load sellers');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (sellerId: string) => {
    try {
      const { error } = await supabase
        .from('seller_stores')
        .update({ is_approved: true })
        .eq('id', sellerId);

      if (error) throw error;
      toast.success('Seller approved successfully');
      fetchSellers();
    } catch (error) {
      console.error('Error approving seller:', error);
      toast.error('Failed to approve seller');
    }
  };

  const handleReject = async (sellerId: string) => {
    try {
      const { error } = await supabase
        .from('seller_stores')
        .update({ is_approved: false })
        .eq('id', sellerId);

      if (error) throw error;
      toast.success('Seller approval revoked');
      fetchSellers();
    } catch (error) {
      console.error('Error rejecting seller:', error);
      toast.error('Failed to revoke approval');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Seller Management</h1>
          <p className="text-muted-foreground mt-2">
            Approve or manage seller accounts
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Sellers</CardTitle>
            <CardDescription>
              Manage seller approvals and view store information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sellers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No sellers registered yet
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Store Name</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sellers.map((seller) => (
                    <TableRow key={seller.id}>
                      <TableCell className="font-medium">
                        {seller.store_name}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {seller.user_id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        {seller.is_approved ? (
                          <Badge className="bg-green-500">Approved</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(seller.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {seller.is_approved ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReject(seller.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Revoke
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApprove(seller.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
