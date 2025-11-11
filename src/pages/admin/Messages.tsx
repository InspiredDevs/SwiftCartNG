import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, MailOpen, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

const Messages = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/admin/login");
      return;
    }
    fetchMessages();
  }, [isAdmin, navigate]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("contact_messages")
        .update({ is_read: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      
      setMessages(messages.map(msg => 
        msg.id === id ? { ...msg, is_read: !currentStatus } : msg
      ));
      
      toast.success(currentStatus ? "Marked as unread" : "Marked as read");
    } catch (error) {
      console.error("Error updating message:", error);
      toast.error("Failed to update message");
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Contact Messages</h1>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {messages.filter(m => !m.is_read).length} Unread
          </Badge>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : messages.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No messages yet</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {messages.map((message) => (
              <Card
                key={message.id}
                className={message.is_read ? "opacity-70" : "border-primary/50"}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{message.name}</CardTitle>
                        {!message.is_read && (
                          <Badge variant="default">New</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {message.email}
                        </span>
                        <span>
                          {new Date(message.created_at).toLocaleDateString()} at{" "}
                          {new Date(message.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsRead(message.id, message.is_read)}
                      >
                        {message.is_read ? (
                          <>
                            <Mail className="h-4 w-4 mr-2" />
                            Mark Unread
                          </>
                        ) : (
                          <>
                            <MailOpen className="h-4 w-4 mr-2" />
                            Mark Read
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="whitespace-pre-wrap text-sm">{message.message}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Messages;
