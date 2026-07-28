'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUserDetail, useBanUser, useUnbanUser, useDeleteUser } from '@/lib/hooks/use-admin';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ArrowLeft, Mail, Calendar, Shield, Activity } from 'lucide-react';
import { useState } from 'react';

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: user, isLoading, error } = useUserDetail(id);
  const banMutation = useBanUser();
  const unbanMutation = useUnbanUser();
  const deleteMutation = useDeleteUser();
  const [showBan, setShowBan] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-destructive">Failed to load user</p>
        <Button variant="outline" onClick={() => router.back()}>Go back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.displayName || user.username}
        description={`@${user.username}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button variant="destructive" onClick={() => setShowBan(true)}>
              {user.isActive ? 'Ban User' : 'Unban User'}
            </Button>
            <Button variant="destructive" onClick={() => setShowDelete(true)}>
              Delete
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{user.email}</span>
              {user.emailVerified && <Badge variant="outline" className="text-emerald-600">Verified</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <Badge>{user.role}</Badge>
              <Badge variant={user.isActive ? 'default' : 'destructive'}>
                {user.isActive ? 'Active' : 'Banned'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span>{user.isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Messages</span>
              <span className="font-medium">{user._count?.messages ?? '--'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Friends</span>
              <span className="font-medium">{user._count?.friends ?? '--'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Reports</span>
              <span className="font-medium">{user._count?.reports ?? '--'}</span>
            </div>
            {user.lastLoginAt && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last login</span>
                <span className="font-medium">{new Date(user.lastLoginAt).toLocaleDateString()}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {user.interests?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Interests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {user.interests.map((i) => (
                  <Badge key={i.id} variant="secondary">{i.name}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {user.privacySettings && (
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <PrivacyRow label="Show last seen" value={user.privacySettings.showLastSeen} />
              <PrivacyRow label="Show online" value={user.privacySettings.showOnline} />
              <PrivacyRow label="Show location" value={user.privacySettings.showLocation} />
            </CardContent>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={showBan}
        onOpenChange={setShowBan}
        title={user.isActive ? 'Ban User' : 'Unban User'}
        description={
          user.isActive
            ? `Are you sure you want to ban ${user.displayName || user.username}?`
            : `Are you sure you want to unban ${user.displayName || user.username}?`
        }
        variant={user.isActive ? 'destructive' : 'default'}
        confirmLabel={user.isActive ? 'Ban' : 'Unban'}
        onConfirm={() => {
          if (user.isActive) banMutation.mutate({ id: user.id });
          else unbanMutation.mutate(user.id);
          setShowBan(false);
        }}
      />

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete User"
        description={`Are you sure you want to delete ${user.displayName || user.username}? This cannot be undone.`}
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={() => { deleteMutation.mutate(user.id); setShowDelete(false); router.push('/dashboard/users'); }}
      />
    </div>
  );
}

function PrivacyRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Badge variant={value ? 'default' : 'secondary'}>{value ? 'On' : 'Off'}</Badge>
    </div>
  );
}
