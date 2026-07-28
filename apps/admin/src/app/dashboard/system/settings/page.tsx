'use client';

import { useSystemSettings, useUpdateSystemSettings } from '@/lib/hooks/use-admin';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';
import type { SystemSettings } from '@/types/admin';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { data, isLoading } = useSystemSettings();
  const updateMutation = useUpdateSystemSettings();
  const [form, setForm] = useState<SystemSettings | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const update = (partial: Partial<SystemSettings>) => {
    if (!form) return;
    setForm({ ...form, ...partial });
  };

  const save = () => {
    if (!form) return;
    updateMutation.mutate(form, {
      onSuccess: () => toast.success('Settings saved'),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="space-y-6">
        <PageHeader title="System Settings" description="Configure application settings" />
        <p className="text-muted-foreground">Failed to load settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Settings"
        description="Configure application settings"
        actions={
          <Button onClick={save} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleRow
              label="Maintenance Mode"
              description="Disable access for all non-admin users"
              checked={form.maintenanceMode}
              onCheckedChange={(v) => update({ maintenanceMode: v })}
            />
            <ToggleRow
              label="Allow New Registrations"
              description="Let new users create accounts"
              checked={form.allowNewRegistrations}
              onCheckedChange={(v) => update({ allowNewRegistrations: v })}
            />
            <ToggleRow
              label="Require Email Verification"
              description="Verify email before allowing full access"
              checked={form.requireEmailVerification}
              onCheckedChange={(v) => update({ requireEmailVerification: v })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxUpload">Max Upload Size (MB)</Label>
              <Input
                id="maxUpload"
                type="number"
                value={form.maxUploadSize}
                onChange={(e) => update({ maxUploadSize: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={form.sessionTimeout}
                onChange={(e) => update({ sessionTimeout: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nearbyRadius">Nearby Radius (meters)</Label>
              <Input
                id="nearbyRadius"
                type="number"
                value={form.nearbyRadius}
                onChange={(e) => update({ nearbyRadius: Number(e.target.value) })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
