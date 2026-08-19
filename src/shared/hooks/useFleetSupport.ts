import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  SupportTicketDto,
  SupportMessageDto,
  CreateSupportTicketDto,
  SendSupportMessageDto,
} from "@shared/types";

// ============================================================
// Query Keys
// ============================================================

export const SUPPORT_KEYS = {
  all: ["supportTickets"] as const,
  tickets: () => [...SUPPORT_KEYS.all, "tickets"] as const,
  ticket: (id: string) => [...SUPPORT_KEYS.all, "ticket", id] as const,
  messages: (ticketId: string) =>
    [...SUPPORT_KEYS.all, "messages", ticketId] as const,
};

// ============================================================
// Helpers
// ============================================================

function unwrap<T>(response: unknown): T {
  if (response === null || response === undefined || response === "") {
    return undefined as unknown as T;
  }

  if (typeof response !== "object") return response as T;

  const resp = response as Record<string, unknown>;

  // Check for nested data structure
  if ("data" in resp && resp.data !== null && resp.data !== undefined) {
    const data = resp.data as Record<string, unknown>;

    // Check for success wrapper
    if (
      ("success" in data || "Success" in data) &&
      "data" in data &&
      data.data !== null &&
      data.data !== undefined
    ) {
      return data.data as T;
    }

    // Check for arrays
    if ("items" in data) return data.items as T;
    if ("tickets" in data) return data.tickets as T;
    if ("conversations" in data) return data.conversations as T;
    if ("messages" in data) return data.messages as T;

    return data as T;
  }

  // Direct response with arrays
  if ("items" in resp) return resp.items as T;
  if ("tickets" in resp) return resp.tickets as T;
  if ("conversations" in resp) return resp.conversations as T;
  if ("messages" in resp) return resp.messages as T;

  return response as T;
}

// ============================================================
// Queries
// ============================================================

/**
 * GET /api/chat/conversations
 * Fetch all support tickets for fleet supervisor
 */
export const useSupportTickets = () => {
  return useQuery<SupportTicketDto[]>({
    queryKey: SUPPORT_KEYS.tickets(),
    queryFn: async () => {
      const response = await apiClient.get("/api/chat/conversations");
      const data = unwrap<any>(response);

      let tickets: any[] = [];

      if (Array.isArray(data)) {
        tickets = data;
      } else if (data?.items) {
        tickets = data.items;
      } else if (data?.tickets) {
        tickets = data.tickets;
      } else if (data?.conversations) {
        tickets = data.conversations;
      } else if (data?.data && Array.isArray(data.data)) {
        tickets = data.data;
      }

      return tickets.map((t: any) => ({
        id: t.id || "",
        subject: t.subject || t.title || "Support Ticket",
        status: t.status || "Open",
        priority: t.priority || "Medium",
        createdAt: t.createdAt || t.created_at || new Date().toISOString(),
        updatedAt:
          t.updatedAt ||
          t.updated_at ||
          t.createdAt ||
          new Date().toISOString(),
        messages: (t.recentMessages || t.messages || []).map((m: any) => ({
          id: m.id || "",
          ticketId: m.ticketId || m.conversationId || t.id || "",
          content: m.content || m.body || m.message || "",
          userType:
            m.userType || (m.senderType === "Support" ? "Support" : "Fleet"),
          userName: m.userName || m.senderName || m.sender_name || "",
          createdAt: m.createdAt || m.created_at || new Date().toISOString(),
          attachmentUrl: m.attachmentUrl || m.attachment_url || null,
        })),
        lastMessage:
          t.lastMessage ||
          (t.recentMessages?.length > 0
            ? t.recentMessages[t.recentMessages.length - 1]
            : null),
      })) as SupportTicketDto[];
    },
    staleTime: 30_000,
    refetchOnMount: true,
    retry: 2,
  });
};

/**
 * GET /api/chat/conversations/{conversationId}/messages
 * Fetch messages for a specific ticket
 */
export const useTicketMessages = (ticketId: string) => {
  return useQuery<SupportMessageDto[]>({
    queryKey: SUPPORT_KEYS.messages(ticketId),
    queryFn: async () => {
      const response = await apiClient.get(
        `/api/chat/conversations/${ticketId}/messages`,
      );
      const data = unwrap<any>(response);

      let messages: any[] = [];

      if (Array.isArray(data)) {
        messages = data;
      } else if (data?.items) {
        messages = data.items;
      } else if (data?.messages) {
        messages = data.messages;
      } else if (data?.data && Array.isArray(data.data)) {
        messages = data.data;
      }

      return messages.map((m: any) => ({
        id: m.id || "",
        ticketId: m.ticketId || m.conversationId || ticketId || "",
        content: m.content || m.body || m.message || "",
        senderType:
          m.senderType ||
          m.sender_type ||
          (m.userType === "Support" ? "Support" : "Fleet"),
        senderName: m.senderName || m.sender_name || "",
        userType:
          m.userType || (m.senderType === "Support" ? "Support" : "Fleet"),
        userName: m.userName || m.senderName || m.sender_name || "",
        createdAt: m.createdAt || m.created_at || new Date().toISOString(),
        attachmentUrl: m.attachmentUrl || m.attachment_url || null,
      })) as SupportMessageDto[];
    },
    enabled: !!ticketId,
    staleTime: 10_000,
    refetchInterval: 5000, // poll for new messages
    retry: 2,
  });
};

// ============================================================
// Mutations
// ============================================================

/**
 * POST /api/chat/conversations
 * Create a new support ticket
 */
export const useCreateTicket = () => {
  const qc = useQueryClient();
  return useMutation<SupportTicketDto, Error, CreateSupportTicketDto>({
    mutationFn: async (dto) => {
      const response = await apiClient.post("/api/chat/conversations", {
        subject: dto.subject,
        initialMessage: dto.message,
        orderId: dto.orderId || null,
      });
      const data = unwrap<any>(response);
      return {
        id: data?.id || "",
        subject: data?.subject || dto.subject,
        status: data?.status || "Open",
        priority: data?.priority || dto.priority || "Medium",
        createdAt: data?.createdAt || new Date().toISOString(),
        updatedAt: data?.updatedAt || new Date().toISOString(),
        messages: [],
      } as SupportTicketDto;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SUPPORT_KEYS.tickets() });
    },
  });
};

/**
 * POST /api/chat/conversations/{conversationId}/messages
 * Send a message in a ticket
 */
export const useSendMessage = () => {
  const qc = useQueryClient();
  return useMutation<SupportMessageDto, Error, SendSupportMessageDto>({
    mutationFn: async (dto) => {
      const response = await apiClient.post(
        `/api/chat/conversations/${dto.ticketId}/messages`,
        {
          content: dto.content,
          messageType: "Text",
          attachmentUrl: dto.attachmentUrl || null,
        },
      );
      const data = unwrap<any>(response);
      return {
        id: data?.id || "",
        ticketId: dto.ticketId,
        content: data?.content || dto.content,
        senderType: "Fleet",
        senderName: data?.userName || data?.senderName || "",
        userType: "Fleet",
        userName: data?.userName || data?.senderName || "",
        createdAt: data?.createdAt || new Date().toISOString(),
        attachmentUrl: data?.attachmentUrl || null,
      } as SupportMessageDto;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: SUPPORT_KEYS.messages(variables.ticketId),
      });
      qc.invalidateQueries({ queryKey: SUPPORT_KEYS.tickets() });
    },
  });
};
