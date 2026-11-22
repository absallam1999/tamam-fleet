import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/config/api";
import type {
  ConversationDto,
  ConversationListItemDto,
  CreateConversationDto,
  MessageDto,
  MessageType,
  PagedResult,
  SendMessageDto,
} from "@shared/types";

// ============================================================
// Local types
// ============================================================

export interface ConversationCreatedDto {
  id: string;
  participantId: string;
  participantType?: string | null;
  customerId: string;
  status?: string | null;
  createdAt: string;
  firstMessage: MessageDto;
}

export interface AttachmentUploadResultDto {
  url: string | null;
  fileName: string | null;
  sizeInBytes: number;
  contentType: string | null;
  messageType: string | null;
}

// ============================================================
// Input types
// ============================================================

export interface TicketListFilters {
  pageIndex?: number;
  pageSize?: number;
  status?: string;
  search?: string;
  orderId?: string;
  sortBy?: string;
}

export interface MessageListFilters {
  pageIndex?: number;
  pageSize?: number;
  since?: string;
  before?: string;
  messageType?: MessageType;
  order?: "asc" | "desc";
}

export interface CreateTicketInput {
  subject: string;
  message: string;
  orderId?: string;
}

export interface SendTicketMessageInput {
  ticketId: string;
  content?: string;
  attachmentUrl?: string;
  messageType?: MessageType;
}

export interface SendAttachmentMessageInput {
  ticketId: string;
  file: File | Blob;
  messageType?: MessageType;
}

export interface UploadAttachmentInput {
  ticketId: string;
  file: File | Blob;
  messageType?: MessageType;
}

export interface CloseTicketInput {
  ticketId: string;
  reason?: string;
}

export interface ChatUnreadCount {
  totalUnread: number;
  conversationsWithUnread: number;
  byConversation?: Record<string, number>;
}

// ============================================================
// Query Keys
// ============================================================

export const SUPPORT_KEYS = {
  all: ["supportTickets"] as const,
  tickets: (filters?: TicketListFilters) =>
    filters
      ? ([...SUPPORT_KEYS.all, "tickets", filters] as const)
      : ([...SUPPORT_KEYS.all, "tickets"] as const),
  ticket: (id: string) => [...SUPPORT_KEYS.all, "ticket", id] as const,
  messages: (ticketId: string, filters?: MessageListFilters) =>
    filters
      ? ([...SUPPORT_KEYS.all, "messages", ticketId, filters] as const)
      : ([...SUPPORT_KEYS.all, "messages", ticketId] as const),
  unreadCount: () => [...SUPPORT_KEYS.all, "unreadCount"] as const,
};

// ============================================================
// Queries
// ============================================================

/**
 * GET /api/chat
 */
export const useSupportTickets = (filters: TicketListFilters = {}) =>
  useQuery<ConversationListItemDto[]>({
    queryKey: SUPPORT_KEYS.tickets(filters),
    queryFn: async () => {
      const params: Record<string, string | number> = {
        PageIndex: filters.pageIndex ?? 1,
        PageSize: filters.pageSize ?? 100,
      };
      if (filters.status) params.Status = filters.status;
      if (filters.search) params.Search = filters.search;
      if (filters.orderId) params.OrderId = filters.orderId;
      if (filters.sortBy) params.SortBy = filters.sortBy;

      const res = await apiClient.get<PagedResult<ConversationListItemDto>>(
        ENDPOINTS.CHAT.BASE,
        params,
      );
      return res.data?.items ?? [];
    },
    staleTime: 30_000,
    refetchOnMount: true,
    retry: 2,
  });

/**
 * GET /api/chat/{id}/messages
 */
export const useTicketMessages = (
  ticketId: string,
  filters: MessageListFilters = {},
) =>
  useQuery<MessageDto[]>({
    queryKey: SUPPORT_KEYS.messages(ticketId, filters),
    queryFn: async () => {
      const params: Record<string, string | number> = {
        PageIndex: filters.pageIndex ?? 1,
        PageSize: filters.pageSize ?? 200,
        Order: filters.order ?? "asc",
      };
      if (filters.since) params.Since = filters.since;
      if (filters.before) params.Before = filters.before;
      if (filters.messageType) params.MessageType = filters.messageType;

      const res = await apiClient.get<PagedResult<MessageDto>>(
        ENDPOINTS.CHAT.MESSAGES(ticketId),
        params,
      );
      return res.data?.items ?? [];
    },
    enabled: !!ticketId,
    staleTime: 10_000,
    refetchInterval: 5_000,
    retry: 2,
  });

/**
 * GET /api/chat/{id}
 */
export const useConversation = (ticketId: string) =>
  useQuery<ConversationDto>({
    queryKey: SUPPORT_KEYS.ticket(ticketId),
    queryFn: async () => {
      const res = await apiClient.get<ConversationDto>(
        ENDPOINTS.CHAT.BY_ID(ticketId),
      );
      return res.data;
    },
    enabled: !!ticketId,
    staleTime: 30_000,
  });

/**
 * GET /api/chat/unread-count
 */
export const useChatUnreadCount = () =>
  useQuery<ChatUnreadCount>({
    queryKey: SUPPORT_KEYS.unreadCount(),
    queryFn: async () => {
      const res = await apiClient.get<ChatUnreadCount>(
        ENDPOINTS.CHAT.UNREAD_COUNT,
      );
      return res.data;
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

// ============================================================
// Mutations
// ============================================================

/**
 * POST /api/chat
 */
export const useCreateTicket = () => {
  const qc = useQueryClient();
  return useMutation<ConversationCreatedDto, Error, CreateTicketInput>({
    mutationFn: async (input) => {
      const payload: CreateConversationDto = {
        subject: input.subject,
        firstMessage: input.message,
        orderId: input.orderId,
      };
      const res = await apiClient.post<ConversationCreatedDto>(
        ENDPOINTS.CHAT.BASE,
        payload,
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SUPPORT_KEYS.tickets() });
      qc.invalidateQueries({ queryKey: SUPPORT_KEYS.unreadCount() });
    },
  });
};

/**
 * POST /api/chat/{id}/messages
 */
export const useSendMessage = () => {
  const qc = useQueryClient();
  return useMutation<MessageDto, Error, SendTicketMessageInput>({
    mutationFn: async (input) => {
      const messageType: MessageType =
        input.messageType ?? (input.attachmentUrl ? "File" : "Text");

      const payload: SendMessageDto = {
        content: input.content,
        attachmentUrl: input.attachmentUrl,
        messageType,
      };
      const res = await apiClient.post<MessageDto>(
        ENDPOINTS.CHAT.MESSAGES(input.ticketId),
        payload,
      );
      return res.data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({
        queryKey: SUPPORT_KEYS.messages(vars.ticketId),
      });
      qc.invalidateQueries({ queryKey: SUPPORT_KEYS.tickets() });
      qc.invalidateQueries({ queryKey: SUPPORT_KEYS.unreadCount() });
    },
  });
};

/**
 * POST /api/chat/{id}/messages/attachment
 */
export const useSendChatAttachment = () => {
  const qc = useQueryClient();
  return useMutation<MessageDto, Error, SendAttachmentMessageInput>({
    mutationFn: async (input) => {
      const formData = new FormData();
      const fileName =
        input.file instanceof File ? input.file.name : "attachment";
      formData.append("File", input.file, fileName);
      if (input.messageType) {
        formData.append("MessageType", input.messageType);
      }

      const res = await apiClient.post<MessageDto>(
        ENDPOINTS.CHAT.MESSAGES_ATTACHMENT(input.ticketId),
        formData,
      );
      return res.data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({
        queryKey: SUPPORT_KEYS.messages(vars.ticketId),
      });
      qc.invalidateQueries({ queryKey: SUPPORT_KEYS.tickets() });
    },
  });
};

/**
 * POST /api/chat/{id}/attachments
 */
export const useUploadChatAttachment = () =>
  useMutation<AttachmentUploadResultDto, Error, UploadAttachmentInput>({
    mutationFn: async (input) => {
      const formData = new FormData();
      const fileName =
        input.file instanceof File ? input.file.name : "attachment";
      formData.append("File", input.file, fileName);
      if (input.messageType) {
        formData.append("MessageType", input.messageType);
      }

      const res = await apiClient.post<AttachmentUploadResultDto>(
        ENDPOINTS.CHAT.ATTACHMENTS(input.ticketId),
        formData,
      );
      return res.data;
    },
  });

/**
 * POST /api/chat/{id}/read
 */
export const useMarkTicketRead = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (ticketId) => {
      await apiClient.post<void>(ENDPOINTS.CHAT.READ(ticketId));
    },
    onSuccess: (_, ticketId) => {
      qc.invalidateQueries({ queryKey: SUPPORT_KEYS.tickets() });
      qc.invalidateQueries({ queryKey: SUPPORT_KEYS.unreadCount() });
      qc.invalidateQueries({ queryKey: SUPPORT_KEYS.messages(ticketId) });
    },
  });
};

/**
 * POST /api/chat/{id}/close
 */
export const useCloseTicket = () => {
  const qc = useQueryClient();
  return useMutation<ConversationDto, Error, CloseTicketInput>({
    mutationFn: async ({ ticketId, reason }) => {
      const res = await apiClient.post<ConversationDto>(
        ENDPOINTS.CHAT.CLOSE(ticketId),
        { reason },
      );
      return res.data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: SUPPORT_KEYS.tickets() });
      qc.invalidateQueries({
        queryKey: SUPPORT_KEYS.messages(vars.ticketId),
      });
      qc.invalidateQueries({ queryKey: SUPPORT_KEYS.unreadCount() });
    },
  });
};