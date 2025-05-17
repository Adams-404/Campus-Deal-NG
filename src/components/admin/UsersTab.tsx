
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Copy, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { deleteUser, fetchUsers as fetchUsersData } from "@/integrations/supabase/admin";
import { trackEvent } from "@/lib/analytics";

interface User {
  id: string;
  email: string;
  created_at: string;
  user_metadata: {
    full_name: string;
    avatar_url: string;
  };
}

const UsersTab = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const userData = await fetchUsersData();
      // Convert the fetched data to match our User interface
      const formattedUsers = userData.map((user: any) => ({
        id: user.id,
        email: user.email || "",
        created_at: user.created_at,
        user_metadata: {
          full_name: user.user_metadata?.full_name || "",
          avatar_url: user.user_metadata?.avatar_url || ""
        }
      }));
      setUsers(formattedUsers);
      
      // Track analytics event
      trackEvent('admin_view_users');
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const fullName = user.user_metadata?.full_name || "";
    return (
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const copyUserId = (userId: string) => {
    navigator.clipboard.writeText(userId);
    toast.success("User ID copied to clipboard");
    // Track analytics event
    trackEvent('admin_copy_user_id');
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      toast.promise(
        deleteUser(userId),
        {
          loading: 'Deleting user...',
          success: 'User deleted successfully',
          error: (err) => `Error: ${err?.message || "Unknown error"}`
        }
      );
      
      // Refresh users after deletion
      fetchUsers();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Users</h2>
        <div className="flex items-center space-x-2">
          <Label htmlFor="search">Search:</Label>
          <Input
            id="search"
            type="text"
            placeholder="Search by email or name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <Table>
        <TableCaption>A list of all registered users.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Avatar</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                Loading users...
              </TableCell>
            </TableRow>
          ) : filteredUsers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                No users found.
              </TableCell>
            </TableRow>
          ) : (
            filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Avatar>
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback>{user.user_metadata?.full_name?.[0]}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell>{user.user_metadata?.full_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {format(new Date(user.created_at), "PPP")}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => copyUserId(user.id)}>
                        <Copy className="h-4 w-4 mr-2" /> Copy User ID
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDeleteUser(user.id)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default UsersTab;
