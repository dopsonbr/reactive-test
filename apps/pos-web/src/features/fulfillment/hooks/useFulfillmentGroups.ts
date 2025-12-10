import { useState, useCallback, useMemo } from 'react';
import type { FulfillmentGroup, FulfillmentType, Address, TimeSlot } from '../types/fulfillment';
import type { LineItem } from '../../transaction/types/transaction';

interface UseFulfillmentGroupsOptions {
  items: LineItem[];
  defaultStoreNumber: number;
}

export function useFulfillmentGroups({ items, defaultStoreNumber }: UseFulfillmentGroupsOptions) {
  const [groups, setGroups] = useState<FulfillmentGroup[]>([]);

  // Get items not assigned to any group
  const unassignedItems = useMemo(() => {
    const assignedIds = new Set(groups.flatMap((g) => g.itemIds));
    return items.filter((item) => !assignedIds.has(item.lineId));
  }, [items, groups]);

  // Check if all items are assigned
  const allItemsAssigned = unassignedItems.length === 0;

  // Check if all groups are configured properly
  const allGroupsReady = useMemo(() => {
    return groups.every((group) => {
      if (group.itemIds.length === 0) return false;

      switch (group.type) {
        case 'IMMEDIATE':
          return true;
        case 'PICKUP':
          return !!group.storeNumber;
        case 'DELIVERY':
          return !!group.address && !!group.scheduledDate;
        case 'WILL_CALL':
          return !!group.storeNumber;
        case 'INSTALLATION':
          return !!group.address && !!group.scheduledDate && !!group.timeSlot;
        default:
          return false;
      }
    });
  }, [groups]);

  const isValid = allItemsAssigned && allGroupsReady && groups.length > 0;

  // Create a new group
  const createGroup = useCallback(
    (type: FulfillmentType): FulfillmentGroup => {
      const newGroup: FulfillmentGroup = {
        id: `group-${Date.now()}`,
        type,
        itemIds: [],
        storeNumber: type === 'IMMEDIATE' || type === 'PICKUP' || type === 'WILL_CALL' ? defaultStoreNumber : undefined,
        estimatedCost: 0,
        status: 'CONFIGURING',
      };

      setGroups((prev) => [...prev, newGroup]);
      return newGroup;
    },
    [defaultStoreNumber]
  );

  // Remove a group
  const removeGroup = useCallback((groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  }, []);

  // Update group configuration
  const updateGroup = useCallback((groupId: string, updates: Partial<FulfillmentGroup>) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, ...updates } : g))
    );
  }, []);

  // Add item to group
  const addItemToGroup = useCallback((groupId: string, itemId: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId && !g.itemIds.includes(itemId)) {
          return { ...g, itemIds: [...g.itemIds, itemId] };
        }
        return g;
      })
    );
  }, []);

  // Remove item from group
  const removeItemFromGroup = useCallback((groupId: string, itemId: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          return { ...g, itemIds: g.itemIds.filter((id) => id !== itemId) };
        }
        return g;
      })
    );
  }, []);

  // Move item between groups
  const moveItem = useCallback((itemId: string, fromGroupId: string, toGroupId: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === fromGroupId) {
          return { ...g, itemIds: g.itemIds.filter((id) => id !== itemId) };
        }
        if (g.id === toGroupId && !g.itemIds.includes(itemId)) {
          return { ...g, itemIds: [...g.itemIds, itemId] };
        }
        return g;
      })
    );
  }, []);

  // Set address for delivery/installation group
  const setGroupAddress = useCallback((groupId: string, address: Address) => {
    updateGroup(groupId, { address });
  }, [updateGroup]);

  // Set schedule for group
  const setGroupSchedule = useCallback((groupId: string, date: Date, slot?: TimeSlot) => {
    updateGroup(groupId, { scheduledDate: date, timeSlot: slot });
  }, [updateGroup]);

  // Auto-assign all unassigned items to IMMEDIATE
  const autoAssignToImmediate = useCallback(() => {
    if (unassignedItems.length === 0) return;

    let immediateGroup = groups.find((g) => g.type === 'IMMEDIATE');
    if (!immediateGroup) {
      immediateGroup = {
        id: `group-${Date.now()}`,
        type: 'IMMEDIATE',
        itemIds: [],
        storeNumber: defaultStoreNumber,
        estimatedCost: 0,
        status: 'CONFIGURING',
      };
      setGroups((prev) => [...prev, immediateGroup!]);
    }

    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === immediateGroup!.id) {
          return {
            ...g,
            itemIds: [...g.itemIds, ...unassignedItems.map((item) => item.lineId)],
          };
        }
        return g;
      })
    );
  }, [groups, unassignedItems, defaultStoreNumber]);

  // Reset all groups
  const resetGroups = useCallback(() => {
    setGroups([]);
  }, []);

  // Calculate total fulfillment cost
  const totalFulfillmentCost = useMemo(() => {
    return groups.reduce((total, group) => total + group.estimatedCost, 0);
  }, [groups]);

  return {
    groups,
    unassignedItems,
    allItemsAssigned,
    allGroupsReady,
    isValid,
    totalFulfillmentCost,
    createGroup,
    removeGroup,
    updateGroup,
    addItemToGroup,
    removeItemFromGroup,
    moveItem,
    setGroupAddress,
    setGroupSchedule,
    autoAssignToImmediate,
    resetGroups,
  };
}
