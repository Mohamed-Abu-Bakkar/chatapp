"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUserGroups,
  getUserDMThreads,
  getGroupMessages,
  getDirectMessages,
  sendMessage,
  getGroupMembers,
  createGroup,
  deleteGroup,
  getInstitutionUsers,
} from "../chat-service";
import type { Message } from "../chat-types";

// Query Keys
export const chatKeys = {
  all: ["chat"] as const,
  groups: (userId: string) => [...chatKeys.all, "groups", userId] as const,
  dmThreads: (userId: string) => [...chatKeys.all, "dm-threads", userId] as const,
  groupMessages: (groupId: string, userId: string) =>
    [...chatKeys.all, "group-messages", groupId, userId] as const,
  directMessages: (userId1: string, userId2: string) =>
    [...chatKeys.all, "direct-messages", userId1, userId2] as const,
  groupMembers: (groupId: string) =>
    [...chatKeys.all, "group-members", groupId] as const,
  institutionUsers: (institutionId: string) =>
    [...chatKeys.all, "institution-users", institutionId] as const,
};

// Hooks for Groups
export function useUserGroups(userId: string | undefined, institutionId: string | undefined) {
  return useQuery({
    queryKey: chatKeys.groups(userId || ""),
    queryFn: () => getUserGroups(userId!),
    enabled: !!userId && !!institutionId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hooks for DM Threads
export function useUserDMThreads(userId: string | undefined) {
  return useQuery({
    queryKey: chatKeys.dmThreads(userId || ""),
    queryFn: () => getUserDMThreads(userId!),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Hooks for Messages
export function useGroupMessages(groupId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: chatKeys.groupMessages(groupId || "", userId || ""),
    queryFn: () => getGroupMessages(groupId!, userId!),
    enabled: !!groupId && !!userId,
    staleTime: 10 * 1000, // 10 seconds for real-time feel
    refetchInterval: 5000, // Auto-refetch every 5 seconds
  });
}

export function useDirectMessages(
  userId1: string | undefined,
  userId2: string | undefined,
  currentUserId: string | undefined
) {
  return useQuery({
    queryKey: chatKeys.directMessages(userId1 || "", userId2 || ""),
    queryFn: () => getDirectMessages(userId1!, userId2!, currentUserId!),
    enabled: !!userId1 && !!userId2 && !!currentUserId,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 5000, // Auto-refetch every 5 seconds
  });
}

// Hooks for Group Members
export function useGroupMembers(groupId: string | undefined) {
  return useQuery({
    queryKey: chatKeys.groupMembers(groupId || ""),
    queryFn: () => getGroupMembers(groupId!),
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hooks for Institution Users
export function useInstitutionUsers(institutionId: string | undefined) {
  return useQuery({
    queryKey: chatKeys.institutionUsers(institutionId || ""),
    queryFn: () => getInstitutionUsers(institutionId!),
    enabled: !!institutionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Mutations
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      senderId,
      senderUsername,
      content,
      type,
      groupId,
      recipientId,
      userRole,
    }: {
      senderId: string;
      senderUsername: string;
      content: string;
      type: "group" | "direct";
      groupId?: string;
      recipientId?: string;
      userRole?: string;
    }) => {
      return sendMessage(
        senderId,
        senderUsername,
        content,
        type,
        groupId,
        recipientId,
        userRole
      );
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch relevant queries
      if (variables.type === "group" && variables.groupId) {
        queryClient.invalidateQueries({
          queryKey: chatKeys.groupMessages(variables.groupId, variables.senderId),
        });
      } else if (variables.type === "direct" && variables.recipientId) {
        queryClient.invalidateQueries({
          queryKey: chatKeys.directMessages(variables.senderId, variables.recipientId),
        });
        queryClient.invalidateQueries({
          queryKey: chatKeys.dmThreads(variables.senderId),
        });
      }
    },
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      institutionId,
      creatorId,
      description,
      isPrivate,
    }: {
      name: string;
      institutionId: string;
      creatorId: string;
      description?: string;
      isPrivate?: boolean;
    }) => {
      return createGroup(
        name,
        institutionId,
        creatorId,
        description,
        isPrivate
      );
    },
    onSuccess: (data, variables) => {
      // Invalidate groups query
      queryClient.invalidateQueries({
        queryKey: chatKeys.groups(variables.creatorId),
      });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      return deleteGroup(groupId);
    },
    onSuccess: (data, variables) => {
      // Invalidate groups query
      queryClient.invalidateQueries({
        queryKey: chatKeys.groups(variables.userId),
      });
    },
  });
}
