import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface RemoveMarkdownParams {
  transactionId: string;
  markdownId: string;
  lineId?: string;
}

// Mock API call
async function removeMarkdownApi(params: RemoveMarkdownParams): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  // In a real implementation, this would call the backend
  console.log('Removing markdown:', params);
}

export function useRemoveMarkdown(transactionId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (params: { markdownId: string; lineId?: string }) =>
      removeMarkdownApi({ transactionId, ...params }),
    onSuccess: () => {
      // Invalidate transaction query to refresh data
      queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] });
    },
  });

  const removeMarkdown = useCallback(
    async (markdownId: string, lineId?: string) => {
      return mutation.mutateAsync({ markdownId, lineId });
    },
    [mutation]
  );

  return {
    removeMarkdown,
    isRemoving: mutation.isPending,
    error: mutation.error,
  };
}
