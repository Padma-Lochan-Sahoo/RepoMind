"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import { api, type ChatMessage } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { streamChatMessage } from "@/lib/stream-chat";
import { toast } from "@/components/ui/toast";

export function useChatSessions(
  repositoryId: string,
  enabled = true
) {
  return useQuery({
    queryKey: queryKeys.chat.sessions(repositoryId),
    queryFn: () => api.listSessions(repositoryId),
    enabled: Boolean(repositoryId) && enabled,
  });
}

export function useChatMessages(sessionId: string | null) {
  return useQuery({
    queryKey: queryKeys.chat.messages(sessionId ?? ""),
    queryFn: () => api.getMessages(sessionId!),
    enabled: Boolean(sessionId),
  });
}

export function useCreateChatSession(repositoryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (title?: string) =>
      api.createSession(repositoryId, title),

    onSuccess: (session) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.chat.sessions(repositoryId),
      });

      queryClient.setQueryData(
        queryKeys.chat.messages(session.id),
        []
      );
    },

    onError: (error: Error) => {
      toast.add({
        title: "Could not create chat",
        description: error.message,
        type: "error",
      });
    },
  });
}

export function useDeleteChatSession(repositoryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => api.deleteSession(sessionId),

    onSuccess: (_data, sessionId) => {
      queryClient.removeQueries({
        queryKey: queryKeys.chat.messages(sessionId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.chat.sessions(repositoryId),
      });

      toast.add({ title: "Chat deleted", type: "success" });
    },

    onError: (error: Error) => {
      toast.add({
        title: "Could not delete chat",
        description: error.message,
        type: "error",
      });
    },
  });
}

export function useStreamChat(
  sessionId: string | null,
  repositoryId: string
) {
  const queryClient = useQueryClient();

  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");

  const abortRef = useRef<AbortController | null>(null);
  const textRef = useRef("");

  const messagesKey = queryKeys.chat.messages(sessionId ?? "");

  // Abort an in-flight answer when the user switches chats or leaves the page,
  // otherwise its tokens would leak into the next conversation.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
      textRef.current = "";
      setStreaming(false);
      setStreamText("");
    };
  }, [sessionId]);

  const send = useCallback(
    async (content: string) => {
      const text = content.trim();
      if (!sessionId || !text || streaming) return;

      const controller = new AbortController();
      abortRef.current = controller;

      const optimisticId = `temp-${Date.now()}`;

      const optimistic: ChatMessage = {
        id: optimisticId,
        role: "USER",
        content: text,
        citations: [],
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<ChatMessage[]>(
        messagesKey,
        (prev) => [...(prev ?? []), optimistic]
      );

      setStreaming(true);
      textRef.current = "";
      setStreamText("");

      let completed = false;

      try {
        await streamChatMessage(sessionId, text, {
          signal: controller.signal,

          onUserMessage: (message) => {
            queryClient.setQueryData<ChatMessage[]>(
              messagesKey,
              (prev) => [
                ...(prev ?? []).filter(
                  (m) => m.id !== optimisticId
                ),
                message,
              ]
            );
          },

          onToken: (token) => {
            textRef.current += token;
            setStreamText(textRef.current);
          },

          onAssistantMessage: (message) => {
            completed = true;
            queryClient.setQueryData<ChatMessage[]>(
              messagesKey,
              (prev) => [...(prev ?? []), message]
            );

            textRef.current = "";
            setStreamText("");
          },
        });
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          // "Stop generating": keep what was streamed so far visible. The
          // server persists the partial reply too, so we re-sync shortly.
          const partial = textRef.current.trim();

          if (partial) {
            queryClient.setQueryData<ChatMessage[]>(
              messagesKey,
              (prev) => [
                ...(prev ?? []),
                {
                  id: `partial-${Date.now()}`,
                  role: "ASSISTANT",
                  content: partial,
                  citations: [],
                  createdAt: new Date().toISOString(),
                },
              ]
            );
          }

          textRef.current = "";
          setStreamText("");

          window.setTimeout(() => {
            void queryClient.invalidateQueries({ queryKey: messagesKey });
          }, 1500);

          return;
        }

        toast.add({
          title: "Message failed",
          description:
            err instanceof Error
              ? err.message
              : "Unknown error",
          type: "error",
        });

        // Re-sync with the server: the question may have been saved even
        // though the answer failed.
        void queryClient.invalidateQueries({ queryKey: messagesKey });

        textRef.current = "";
        setStreamText("");
      } finally {
        setStreaming(false);
        abortRef.current = null;

        // A new chat gets its title from the first question (server side).
        void queryClient.invalidateQueries({
          queryKey: queryKeys.chat.sessions(repositoryId),
        });

        if (completed) {
          // Replace optimistic data with canonical rows from the server.
          void queryClient.invalidateQueries({ queryKey: messagesKey });
        }
      }
    },
    [sessionId, streaming, queryClient, messagesKey, repositoryId]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { send, stop, streaming, streamText };
}
