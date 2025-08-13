import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { UserProfile } from "./types";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Users as UsersIcon, Shield } from "lucide-react";

interface AdminMessagesTabProps {
  users: UserProfile[];
}

export default function AdminMessagesTab({ users }: AdminMessagesTabProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [admins, setAdmins] = useState<{ id: string; first_name: string | null; last_name: string | null; avatar_url: string | null }[]>([]);
  const [senderAdminId, setSenderAdminId] = useState<string>("");

  useEffect(() => {
    const loadAdmins = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const currentId = authData?.user?.id;

        const { data, error } = await supabase
          .from('profiles')
          .select(`id, first_name, last_name, avatar_url, roles:user_roles(role)`) as any;
        if (error) throw error;

        const onlyAdmins = (data || []).filter((p: any) => p.roles?.some((r: any) => r.role === 'admin'))
          .map((p: any) => ({ id: p.id, first_name: p.first_name, last_name: p.last_name, avatar_url: p.avatar_url }));
        setAdmins(onlyAdmins);

        // Default sender to current user if admin, else first admin
        const defaultSender = onlyAdmins.find(a => a.id === currentId)?.id || (onlyAdmins[0]?.id ?? "");
        setSenderAdminId(defaultSender);
      } catch (e) {
        console.error('Failed to load admins', e);
        toast.error('Failed to load admins');
      }
    };
    loadAdmins();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.first_name, u.last_name, (u as any).email]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [users, search]);

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? filteredUsers.map((u) => u.id) : []);
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id)));
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }
    if (selectedIds.length === 0) {
      toast.error("Select at least one recipient");
      return;
    }
    if (!senderAdminId) {
      toast.error("Select a sender admin");
      return;
    }
    try {
      setSending(true);
      const { error } = await supabase.rpc("send_admin_notifications", {
        user_ids: selectedIds,
        notif_title: title.trim(),
        notif_content: message.trim(),
        sender_admin_id: senderAdminId,
      });
      if (error) throw error;
      toast.success(`Notification sent to ${selectedIds.length} user(s)`);
      setTitle("");
      setMessage("");
      setSelectedIds([]);
    } catch (err) {
      console.error("Failed to send notifications", err);
      toast.error("Failed to send notifications");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Send Notification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-3">
              <Input
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Textarea
                placeholder="Write your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
              />
              <div className="border border-border rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    Sender (Admin)
                  </div>
                </div>
                <div className="space-y-2 max-h-40 overflow-auto">
                  {admins.map((a) => (
                    <label key={a.id} className="flex items-center gap-3 p-2 rounded hover:bg-secondary/40 cursor-pointer">
                      <input
                        type="radio"
                        name="senderAdmin"
                        className="accent-[#1078a7]"
                        checked={senderAdminId === a.id}
                        onChange={() => setSenderAdminId(a.id)}
                      />
                      <div className="h-8 w-8 rounded-full overflow-hidden bg-secondary flex items-center justify-center">
                        {a.avatar_url ? (
                          <img src={a.avatar_url} alt="admin" className="h-full w-full object-cover" />
                        ) : (
                          <div className="text-xs text-muted-foreground">A</div>
                        )}
                      </div>
                      <div className="text-sm font-medium">
                        {(a.first_name || '') + ' ' + (a.last_name || '')}
                      </div>
                    </label>
                  ))}
                  {admins.length === 0 && (
                    <div className="text-sm text-muted-foreground">No admins found</div>
                  )}
                </div>
              </div>
            </div>
            <div className="md:col-span-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UsersIcon className="h-4 w-4" />
                  Recipients
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      // Get up to 50 random user IDs from filtered users
                      const shuffled = [...filteredUsers].sort(() => 0.5 - Math.random());
                      const random50 = shuffled.slice(0, 50).map(u => u.id);
                      setSelectedIds(random50);
                    }}
                    disabled={filteredUsers.length === 0}
                    className="text-xs h-8"
                  >
                    Select Random 50
                  </Button>
                  <Badge variant="outline">{selectedIds.length} selected</Badge>
                </div>
              </div>
              <Input
                placeholder="Search users"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-2"
              />
              <div className="max-h-64 overflow-auto rounded border border-border divide-y">
                <label className="flex items-center gap-3 p-2 text-sm bg-secondary/40">
                  <Checkbox
                    checked={selectedIds.length === filteredUsers.length && filteredUsers.length > 0}
                    onCheckedChange={(v) => toggleAll(Boolean(v))}
                  />
                  <span className="font-medium">Select all ({filteredUsers.length})</span>
                </label>
                {filteredUsers.map((u) => (
                  <label key={u.id} className="flex items-center gap-3 p-2 text-sm hover:bg-secondary/40 cursor-pointer">
                    <Checkbox
                      checked={selectedIds.includes(u.id)}
                      onCheckedChange={(v) => toggleOne(u.id, Boolean(v))}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">{u.first_name} {u.last_name}</div>
                      {/** @ts-ignore email might be present in profile */}
                      {(u as any).email && (
                        <div className="text-xs text-muted-foreground truncate">{(u as any).email}</div>
                      )}
                    </div>
                  </label>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="p-3 text-sm text-muted-foreground">No users match your search</div>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSend} disabled={sending}>
              {sending ? "Sending..." : "Send Notification"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
