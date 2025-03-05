
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShieldCheck, AlertTriangle, Loader2, Shield, Search, UserIcon } from 'lucide-react';
import { UserProfile } from './types';
import { getKycStatusBadgeProps } from '@/utils/kycUtils';

interface UsersTabProps {
  users: UserProfile[];
  onViewUserProfile: (userId: string) => void;
  onAdminAction: (user: UserProfile | null, action: 'add' | 'remove') => void;
}

export const UsersTab = ({ users, onViewUserProfile, onAdminAction }: UsersTabProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredUsers = users.filter(user => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  const getAdminBadge = (user: UserProfile) => {
    const isAdmin = user.roles?.some(role => role === 'admin');
    
    if (isAdmin) {
      return (
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
          Admin
        </Badge>
      );
    }
    
    return null;
  };

  const getStatusBadge = (status: string | null) => {
    const props = getKycStatusBadgeProps(status);
    
    return (
      <Badge variant={props.variant} className={props.className}>
        {props.icon}
        {props.label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>KYC Status</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || undefined} alt={`${user.first_name} ${user.last_name}`} />
                          <AvatarFallback className="text-xs">
                            {user.first_name?.[0] || ''}{user.last_name?.[0] || ''}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {user.first_name} {user.last_name || ''}
                          </div>
                          <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {user.id.split('-')[0]}...
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user.kyc_status)}
                    </TableCell>
                    <TableCell>
                      {getAdminBadge(user)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewUserProfile(user.id)}
                        >
                          <UserIcon className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        
                        {user.roles?.some(role => role === 'admin') ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => onAdminAction(user, 'remove')}
                          >
                            Remove Admin
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
                            onClick={() => onAdminAction(user, 'add')}
                          >
                            Make Admin
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
