'use client';

import { useLocationActivity } from '@/lib/hooks/use-admin';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

export default function LocationActivityPage() {
  const { data, isLoading } = useLocationActivity();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Location Activity"
        description="Real-time user location updates"
      />

      <Card>
        <CardHeader>
          <CardTitle>Map View</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[400px]" />
          ) : (
            <div className="flex h-[400px] items-center justify-center rounded-lg border bg-muted/20">
              <p className="text-sm text-muted-foreground">
                Map integration requires a map provider (Google Maps / Mapbox)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Location Updates</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Coordinates</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No location data available
                    </TableCell>
                  </TableRow>
                ) : (
                  (data ?? []).map((loc) => (
                    <TableRow key={loc.id}>
                      <TableCell className="font-medium">{loc.username}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                      </TableCell>
                      <TableCell>{new Date(loc.updatedAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
