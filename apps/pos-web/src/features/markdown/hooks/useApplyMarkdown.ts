import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MarkdownInput, MarkdownInfo } from '../types/markdown';

interface ApplyMarkdownParams {
  transactionId: string;
  markdown: MarkdownInput;
}

interface ApplyMarkdownResult {
  success: boolean;
  markdown: MarkdownInfo;
}

// Mock API call
async function applyMarkdownApi(params: ApplyMarkdownParams): Promise<ApplyMarkdownResult> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Simulate API response
  const markdown: MarkdownInfo = {
    id: `md-${Date.now()}`,
    lineId: params.markdown.lineId,
    type: params.markdown.type,
    value: params.markdown.value,
    reason: params.markdown.reason,
    notes: params.markdown.notes,
    appliedBy: 'current-user', // Would come from auth context
    appliedAt: new Date(),
  };

  return { success: true, markdown };
}

export function useApplyMarkdown(transactionId: string) {
  const queryClient = useQueryClient();
  const [pendingOverride, setPendingOverride] = useState<MarkdownInput | null>(null);

  const mutation = useMutation({
    mutationFn: (markdown: MarkdownInput) =>
      applyMarkdownApi({ transactionId, markdown }),
    onSuccess: () => {
      // Invalidate transaction query to refresh data
      queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] });
    },
  });

  const applyMarkdown = useCallback(
    async (markdown: MarkdownInput) => {
      return mutation.mutateAsync(markdown);
    },
    [mutation]
  );

  const requestOverride = useCallback((markdown: MarkdownInput) => {
    setPendingOverride(markdown);
  }, []);

  const clearPendingOverride = useCallback(() => {
    setPendingOverride(null);
  }, []);

  const applyWithOverride = useCallback(
    async (authorizedBy: string) => {
      if (!pendingOverride) return;

      const markdownWithOverride: MarkdownInput = {
        ...pendingOverride,
        overrideAuthorizedBy: authorizedBy,
      };

      const result = await mutation.mutateAsync(markdownWithOverride);
      setPendingOverride(null);
      return result;
    },
    [pendingOverride, mutation]
  );

  return {
    applyMarkdown,
    requestOverride,
    applyWithOverride,
    clearPendingOverride,
    pendingOverride,
    isApplying: mutation.isPending,
    error: mutation.error,
  };
}
