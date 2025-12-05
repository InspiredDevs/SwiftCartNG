import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import SellerHeader from '@/components/seller/SellerHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Send, Upload, MessageSquare, X } from 'lucide-react';

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  image_url: string | null;
  status: string;
  admin_reply: string | null;
  created_at: string;
}

export default function Support() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

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
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in subject and message');
      return;
    }

    setSubmitting(true);

    try {
      let imageUrl: string | null = null;

      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
        
        imageUrl = urlData.publicUrl;
      }

      // Create ticket
      const { error } = await supabase
        .from('seller_support_tickets')
        .insert({
          seller_id: user.id,
          seller_email: user.email || '',
          subject: subject.trim(),
          message: message.trim(),
          image_url: imageUrl,
          status: 'open'
        });

      if (error) throw error;

      toast.success("Support ticket submitted. We'll get back to you soon.");
      setSubject('');
      setMessage('');
      setImageFile(null);
      setImagePreview(null);
      fetchTickets();
    } catch (error) {
      console.error('Error submitting ticket:', error);
      toast.error('Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SellerHeader />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Support</h1>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Submit Ticket Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Submit a Support Ticket
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="What do you need help with?"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your issue in detail..."
                    rows={5}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Attachment (Optional)</Label>
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-24 w-24 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="max-w-xs"
                      />
                    </div>
                  )}
                </div>

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Past Tickets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Your Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : tickets.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No support tickets yet
                </p>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-4 border rounded-lg space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium">{ticket.subject}</h4>
                        <Badge
                          variant={ticket.status === 'open' ? 'default' : 'secondary'}
                        >
                          {ticket.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {ticket.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </p>
                      {ticket.admin_reply && (
                        <div className="mt-2 p-3 bg-primary/10 rounded-lg">
                          <p className="text-xs font-medium text-primary mb-1">
                            Admin Reply:
                          </p>
                          <p className="text-sm">{ticket.admin_reply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}