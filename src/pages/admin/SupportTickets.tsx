import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MessageSquare, Mail, Send, Image } from 'lucide-react';

interface SupportTicket {
  id: string;
  seller_id: string;
  seller_email: string;
  subject: string;
  message: string;
  image_url: string | null;
  status: string;
  admin_reply: string | null;
  created_at: string;
}

export default function SupportTickets() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState('');
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin/login');
      return;
    }
    fetchTickets();
  }, [isAdmin, navigate]);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('seller_support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!selectedTicket || !reply.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    setReplying(true);
    try {
      const { error } = await supabase
        .from('seller_support_tickets')
        .update({
          admin_reply: reply.trim(),
          status: 'closed'
        })
        .eq('id', selectedTicket.id);

      if (error) throw error;

      toast.success('Reply sent successfully');
      setSelectedTicket(null);
      setReply('');
      fetchTickets();
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setReplying(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Seller Support Tickets</h1>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {tickets.filter(t => t.status === 'open').length} Open
          </Badge>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : tickets.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No support tickets yet</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {tickets.map((ticket) => (
              <Card
                key={ticket.id}
                className={ticket.status === 'open' ? 'border-primary/50' : 'opacity-70'}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                        <Badge
                          variant={ticket.status === 'open' ? 'default' : 'secondary'}
                        >
                          {ticket.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {ticket.seller_email}
                        </span>
                        <span>
                          {new Date(ticket.created_at).toLocaleDateString()} at{' '}
                          {new Date(ticket.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    {ticket.status === 'open' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setReply('');
                        }}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Reply
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="whitespace-pre-wrap text-sm">{ticket.message}</p>
                  </div>
                  
                  {ticket.image_url && (
                    <div className="flex items-center gap-2">
                      <Image className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={ticket.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        View Attachment
                      </a>
                    </div>
                  )}

                  {ticket.admin_reply && (
                    <div className="bg-primary/10 rounded-lg p-4">
                      <p className="text-xs font-medium text-primary mb-2">Your Reply:</p>
                      <p className="text-sm whitespace-pre-wrap">{ticket.admin_reply}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Reply Dialog */}
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Reply to Ticket</DialogTitle>
            </DialogHeader>
            {selectedTicket && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">{selectedTicket.subject}</p>
                  <p className="text-xs text-muted-foreground">{selectedTicket.seller_email}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <p className="text-sm">{selectedTicket.message}</p>
                </div>
                <Textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type your reply..."
                  rows={4}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleReply} disabled={replying}>
                    {replying ? 'Sending...' : 'Send Reply'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}