import { useState, useEffect } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { UserProfile } from "./types";
import { getKycStatusBadgeProps } from "@/utils/kycUtils";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UsersTabProps {
  users: UserProfile[];
  totalUsers: number;
  currentPage: number;
  usersPerPage: number;
  onPageChange: (page: number) => void;
  onViewUserProfile: (userId: string) => void;
  onAdminAction: (user: UserProfile | null, action: 'add' | 'remove') => void;
}

const isAdmin = (user: UserProfile) => {
  return user.roles?.some(role => role.role === 'admin') || false;
};

export function UsersTab({ 
  users, 
  totalUsers, 
  currentPage, 
  usersPerPage, 
  onPageChange, 
  onViewUserProfile, 
  onAdminAction 
}: UsersTabProps) {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [usersData, setUsersData] = useState(users);

  // Listen for profile updates
  useEffect(() => {
    const profilesChannel = supabase
      .channel('users-tab-profiles-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: 'kyc_status=eq.processing,kyc_status=eq.verified,kyc_status=eq.rejected,kyc_status=eq.pending'
        },
        (payload) => {
          console.log('Profile update detected:', payload);
          setUsersData(prevUsers => 
            prevUsers.map(user => 
              user.id === payload.new.id 
                ? { ...user, kyc_status: payload.new.kyc_status } 
                : user
            )
          );
        }
      )
      .on(
        'system',
        { event: '*' },
        (payload) => {
          console.log('System event:', payload);
        }
      )
      .on('broadcast', { event: 'test' }, (payload) => {
        console.log('Broadcast received!', payload);
      })
      .on('error', (error) => {
        console.error('Profiles channel error:', error);
        toast.error('Connection to profile updates lost. Please refresh the page.');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
    };
  }, []);

  // Update usersData when users prop changes
  useEffect(() => {
    setUsersData(users);
  }, [users]);

  const columns: ColumnDef<UserProfile>[] = [
    {
      accessorKey: "first_name",
      header: "First Name",
    },
    {
      accessorKey: "last_name",
      header: "Last Name",
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => {
        return row.original.email || "N/A";
      },
    },
    {
      accessorKey: "kyc_status",
      header: "KYC Status",
      cell: ({ row }) => {
        const status = row.getValue("kyc_status");
        // Use getKycStatusBadgeProps to get consistent styling
        const badgeProps = getKycStatusBadgeProps(status as any);
        return (
          <Badge 
            variant="outline" 
            className={badgeProps.className}
          >
            {badgeProps.icon}
            {badgeProps.label}
          </Badge>
        );
      },
    },
    {
      id: "role",
      header: "Role",
      cell: ({ row }) => {
        const user = row.original;
        const userRoleLabel = isAdmin(user) ? (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            Admin
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-slate-500/20">
            User
          </Badge>
        );
        return userRoleLabel;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleViewUserProfile(user.id)}>
                <Edit className="h-4 w-4 mr-2" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onAdminAction(user, isAdmin(user) ? 'remove' : 'add')}>
                {isAdmin(user) ? 'Remove Admin' : 'Make Admin'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: usersData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getPaginationRowModel: getCoreRowModel(),
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  const handleViewUserProfile = (userId: string) => {
    console.log('User ID to view profile:', userId);
    onViewUserProfile(userId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>Manage users and their roles.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center py-4">
          <Input
            type="text"
            placeholder="Filter users..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {usersData.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium">
              {Math.min((currentPage - 1) * usersPerPage + 1, totalUsers)}
            </span> to{' '}
            <span className="font-medium">
              {Math.min(currentPage * usersPerPage, totalUsers)}
            </span> of <span className="font-medium">{totalUsers}</span> users
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Previous page</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            {Array.from({ length: Math.ceil(totalUsers / usersPerPage) }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage * usersPerPage >= totalUsers}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Next page</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
