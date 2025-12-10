import { useState } from 'react';
import {
  FileText,
  User,
  Store,
  Clock,
  ChevronDown,
  ChevronUp,
  Filter,
  Download,
} from 'lucide-react';
import { useAuditSearch } from '../hooks/useAuditLog';
import type { AuditAction, AuditSeverity } from '../types/audit';
import { AUDIT_ACTION_CONFIG, SEVERITY_COLORS } from '../types/audit';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Skeleton,
  cn,
} from '@reactive-platform/shared-ui-components';

interface AuditTrailProps {
  transactionId?: string;
  customerId?: string;
  orderId?: string;
  storeNumber?: number;
}

export function AuditTrail({
  transactionId,
  customerId,
  orderId,
  storeNumber,
}: AuditTrailProps) {
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState<AuditAction | 'ALL'>('ALL');
  const [severityFilter, setSeverityFilter] = useState<AuditSeverity | 'ALL'>('ALL');
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  const { data, isLoading } = useAuditSearch({
    page,
    size: 20,
    transactionId,
    customerId,
    storeNumber,
    action: actionFilter !== 'ALL' ? actionFilter : undefined,
    severity: severityFilter !== 'ALL' ? severityFilter : undefined,
  });

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const toggleExpanded = (id: string) => {
    setExpandedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExport = () => {
    // In production, this would generate a CSV/PDF export
    console.log('Exporting audit trail...');
  };

  // Get unique actions for filter dropdown
  const actionOptions = Object.keys(AUDIT_ACTION_CONFIG) as AuditAction[];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Audit Trail
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1">
            <Select value={actionFilter} onValueChange={(v) => setActionFilter(v as AuditAction | 'ALL')}>
              <SelectTrigger>
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Actions</SelectItem>
                {actionOptions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {AUDIT_ACTION_CONFIG[action].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-40">
            <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as AuditSeverity | 'ALL')}>
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="INFO">Info</SelectItem>
                <SelectItem value="WARNING">Warning</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Entries */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : data?.entries.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No audit entries found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data?.entries.map((entry) => {
              const config = AUDIT_ACTION_CONFIG[entry.action];
              const isExpanded = expandedEntries.has(entry.id);

              return (
                <Collapsible key={entry.id} open={isExpanded} onOpenChange={() => toggleExpanded(entry.id)}>
                  <div className="rounded-lg border">
                    <CollapsibleTrigger asChild>
                      <button className="w-full p-3 flex items-center justify-between hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Badge className={cn(SEVERITY_COLORS[entry.severity], 'text-white text-xs')}>
                            {entry.severity}
                          </Badge>
                          <div className="text-left">
                            <p className="font-medium">{config.label}</p>
                            <p className="text-sm text-muted-foreground">{entry.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <User className="h-3 w-3" />
                              {entry.userName}
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDateTime(entry.timestamp)}
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="px-3 pb-3 pt-0 border-t">
                        <div className="grid grid-cols-2 gap-4 pt-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">User</p>
                            <p>{entry.userName} ({entry.userRole})</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Store</p>
                            <p>#{entry.storeNumber} - {entry.registerId}</p>
                          </div>
                          {entry.transactionId && (
                            <div>
                              <p className="text-muted-foreground">Transaction</p>
                              <p className="font-mono text-xs">{entry.transactionId}</p>
                            </div>
                          )}
                          {entry.orderId && (
                            <div>
                              <p className="text-muted-foreground">Order</p>
                              <p className="font-mono text-xs">{entry.orderId}</p>
                            </div>
                          )}
                          {entry.authorizedBy && (
                            <div>
                              <p className="text-muted-foreground">Authorized By</p>
                              <p>{entry.authorizerName || entry.authorizedBy}</p>
                            </div>
                          )}
                        </div>

                        {Object.keys(entry.details).length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-muted-foreground text-sm mb-2">Details</p>
                            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                              {JSON.stringify(entry.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Page {data.currentPage + 1} of {data.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.totalPages - 1}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
