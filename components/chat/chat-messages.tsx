"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  sendMessage,
  getGroupMessages,
  getDirectMessages,
  deleteMessageForMe,
  deleteMessageForEveryone,
} from "@/app/lib/chat-service";
import type { Message } from "@/app/lib/chat-types";
import { Send, MoreVertical, Trash2, MessageSquare, Megaphone, Clock } from "lucide-react";
import { realtime } from "@/app/lib/appwrite";

interface ChatMessagesProps {
  type: "group" | "direct";
  chatId: string;
  currentUserId: string;
  currentUsername: string;
  recipientId?: string;
  userRole?: string;
  isAnnouncement?: boolean;
}

export function ChatMessages({
  type,
  chatId,
  currentUserId,
  currentUsername,
  recipientId,
  userRole,
  isAnnouncement,
}: ChatMessagesProps) {
  console.log("ChatMessages props:", {
    type,
    chatId,
    userRole,
    isAnnouncement,
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    loadMessages();
    setupRealtimeSubscription();

    return () => {
      if (
        subscriptionRef.current &&
        typeof subscriptionRef.current === "function"
      ) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
    };
  }, [chatId, type]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      let fetchedMessages: Message[] = [];
      if (type === "group") {
        fetchedMessages = await getGroupMessages(chatId, currentUserId);
      } else if (type === "direct" && recipientId) {
        fetchedMessages = await getDirectMessages(
          currentUserId,
          recipientId,
          currentUserId
        );
      }
      setMessages(fetchedMessages);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const setupRealtimeSubscription = () => {
    try {
      const DATABASE_ID =
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "69134fb7001b67bbe609";

      const unsubscribe = realtime.subscribe(
        `databases.${DATABASE_ID}.collections.messages.documents`,
        (response: any) => {
          if (
            response.events.includes(
              "databases.*.collections.*.documents.*.create"
            )
          ) {
            const newMsg = response.payload as Message;

            // Only add if it belongs to this chat and doesn't already exist
            const shouldAdd =
              (type === "group" && newMsg.groupId === chatId) ||
              (type === "direct" &&
                ((newMsg.senderId === currentUserId &&
                  newMsg.recipientId === recipientId) ||
                  (newMsg.senderId === recipientId &&
                    newMsg.recipientId === currentUserId)));

            if (shouldAdd) {
              setMessages((prev) => {
                // Check if message already exists to prevent duplicates
                const exists = prev.some((msg) => msg.$id === newMsg.$id);
                if (!exists) {
                  return [...prev, newMsg];
                }
                return prev;
              });
            }
          } else if (
            response.events.includes(
              "databases.*.collections.*.documents.*.update"
            )
          ) {
            const updatedMsg = response.payload as Message;

            // Check if this message belongs to our chat
            const belongsToChat =
              (type === "group" && updatedMsg.groupId === chatId) ||
              (type === "direct" &&
                ((updatedMsg.senderId === currentUserId &&
                  updatedMsg.recipientId === recipientId) ||
                  (updatedMsg.senderId === recipientId &&
                    updatedMsg.recipientId === currentUserId)));

            if (belongsToChat) {
              setMessages((prev) => {
                // Check if the message was deleted by current user
                const deletedBy = updatedMsg.deletedBy || [];
                const isDeletedForCurrentUser =
                  deletedBy.includes(currentUserId);

                if (isDeletedForCurrentUser) {
                  // Remove the message from local state
                  return prev.filter((msg) => msg.$id !== updatedMsg.$id);
                } else {
                  // Update the message in local state
                  return prev.map((msg) =>
                    msg.$id === updatedMsg.$id ? updatedMsg : msg
                  );
                }
              });
            }
          } else if (
            response.events.includes(
              "databases.*.collections.*.documents.*.delete"
            )
          ) {
            const deletedMsg = response.payload as Message;

            // Remove deleted message from local state
            setMessages((prev) =>
              prev.filter((msg) => msg.$id !== deletedMsg.$id)
            );
          }
        }
      );

      subscriptionRef.current = unsubscribe;
    } catch (error) {
      console.error("Error setting up realtime subscription:", error);
    }
  };

  const handleDeleteForMe = async (messageId: string) => {
    try {
      await deleteMessageForMe(messageId, currentUserId);
      // Remove the message from local state
      setMessages((prev) => prev.filter((msg) => msg.$id !== messageId));
    } catch (error) {
      console.error("Error deleting message for me:", error);
      alert("Failed to delete message");
    }
  };

  const handleDeleteForEveryone = async (messageId: string) => {
    try {
      await deleteMessageForEveryone(messageId, currentUserId);
      // Update the message in local state to show as deleted
      setMessages((prev) =>
        prev.map((msg) =>
          msg.$id === messageId
            ? {
                ...msg,
                deletedForEveryone: true,
              }
            : msg
        )
      );
    } catch (error) {
      console.error("Error deleting message for everyone:", error);
      alert(
        error instanceof Error ? error.message : "Failed to delete message"
      );
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      await sendMessage(
        currentUserId,
        currentUsername,
        newMessage,
        type,
        type === "group" ? chatId : undefined,
        type === "direct" ? recipientId : undefined,
        userRole
      );
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 md:bg-white md:dark:bg-gray-950">
      {/* Messages Container */}
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 overflow-y-auto px-2 py-3 space-y-2 md:px-4 md:py-6 md:space-y-6 chat-messages-scroll">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 md:w-20 md:h-20">
                {isAnnouncement ? (
                  <Megaphone className="w-8 h-8 text-blue-600 md:w-10 md:h-10" />
                ) : (
                  <MessageSquare className="w-8 h-8 text-gray-400 md:w-10 md:h-10" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 md:text-2xl">
                {isAnnouncement ? "No announcements yet" : "No messages yet"}
              </h3>
              <p className="text-base text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed px-2">
                {isAnnouncement
                  ? "Announcements from administrators and teachers will appear here."
                  : "Start the conversation by sending the first message."
                }
              </p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isOwnMessage = msg.senderId === currentUserId;
              const showAvatar = !isOwnMessage && (index === 0 || messages[index - 1].senderId !== msg.senderId);
              const showTimestamp = index === 0 ||
                new Date(msg.createdAt).toDateString() !== new Date(messages[index - 1].createdAt).toDateString();

              return (
                <div key={msg.$id}>
                  {/* Date separator - WhatsApp style */}
                  {showTimestamp && (
                    <div className="flex justify-center my-4 md:my-6">
                      <div className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs px-3 py-1 rounded-full font-medium">
                        {new Date(msg.createdAt).toLocaleDateString([], {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                          ...(new Date(msg.createdAt).getFullYear() !== new Date().getFullYear() && {
                            year: 'numeric'
                          })
                        })}
                      </div>
                    </div>
                  )}

                  <div
                    className={`flex items-start gap-2 group px-2 md:gap-3 md:px-0 ${
                      isOwnMessage ? "justify-end" : "justify-start"
                    }`}
                  >
                  {/* Avatar for other users - hidden on mobile for cleaner look */}
                  {!isOwnMessage && (
                    <div className={`hidden md:flex w-8 h-8 rounded-full items-center justify-center text-xs font-semibold ${
                      showAvatar
                        ? "bg-blue-600 text-white"
                        : "bg-transparent"
                    }`}>
                      {showAvatar ? msg.senderUsername.charAt(0).toUpperCase() : ""}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={`relative max-w-[85%] sm:max-w-[75%] md:max-w-[65%] ${isOwnMessage ? "order-1" : "order-2"}`}>
                    {/* Sender name for group messages - smaller on mobile */}
                    {!isOwnMessage && showAvatar && (
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 px-2 md:px-1">
                        {msg.senderUsername}
                      </div>
                    )}

                    <div
                      className={`relative px-3 py-2 rounded-2xl shadow-sm md:px-4 md:py-3 ${
                        msg.deletedForEveryone
                          ? "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 italic"
                          : isOwnMessage
                          ? "bg-blue-600 text-white ml-12 md:ml-0"
                          : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white mr-12 md:mr-0 border border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      {msg.deletedForEveryone ? (
                        <div className="flex items-center gap-2">
                          <Trash2 className="w-4 h-4" />
                          <span className="text-sm md:text-base">This message was deleted</span>
                        </div>
                      ) : (
                        <>
                          <div className="text-sm md:text-base leading-relaxed break-words">
                            {msg.content}
                          </div>
                          <div className={`flex items-center justify-end gap-1 mt-1 text-xs md:mt-2 ${
                            isOwnMessage
                              ? "text-blue-100"
                              : "text-gray-500 dark:text-gray-400"
                          }`}>
                            <Clock className="w-3 h-3" />
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </>
                      )}

                      {/* Message tail - WhatsApp style */}
                      <div className={`absolute top-0 w-0 h-0 ${
                        isOwnMessage
                          ? "-right-2 border-l-[6px] border-l-blue-600 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent"
                          : "-left-2 border-r-[6px] border-r-white dark:border-r-gray-800 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent"
                      }`} />
                    </div>

                    {/* Delete buttons - touch-friendly on mobile */}
                    {!msg.deletedForEveryone && (
                      <div className={`absolute -top-1 md:-top-2 ${
                        isOwnMessage ? "-left-10 md:-left-12" : "-right-10 md:-right-12"
                      } opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 transition-all duration-200 flex flex-col gap-1 z-10`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteForMe(msg.$id)}
                          className="h-8 w-8 md:h-8 md:w-8 p-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors rounded-full active:scale-95"
                          title="Delete for me"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        {isOwnMessage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteForEveryone(msg.$id)}
                            className="h-8 w-8 md:h-8 md:w-8 p-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors rounded-full active:scale-95"
                            title="Delete for everyone"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Spacer for own messages - adjusted for mobile */}
                  {isOwnMessage && <div className="w-2 md:w-8" />}
                </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input Area - WhatsApp style */}
      {(() => {
        const canSend =
          !isAnnouncement || userRole === "Admin" || userRole === "admin" || userRole === "teacher";
        return canSend;
      })() && (
        <div className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 px-3 py-2 md:px-4 md:py-4 safe-area-inset-bottom">
          <form onSubmit={handleSend} className="flex items-end gap-2 md:gap-3 max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={
                  isAnnouncement ? "Send an announcement..." : "Type a message..."
                }
                disabled={loading}
                maxLength={5000}
                className="min-h-10 md:min-h-11 resize-none border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-full px-4 py-2 md:px-4 md:py-3 pr-12 md:pr-12 text-base shadow-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
              />
              {newMessage.length > 4500 && (
                <div className="absolute -top-6 right-0 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-950 px-2 py-1 rounded shadow-sm">
                  {5000 - newMessage.length} left
                </div>
              )}
            </div>
            <Button
              type="submit"
              disabled={loading || !newMessage.trim()}
              className="h-10 w-10 md:h-11 md:w-11 p-0 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 rounded-full shadow-md transition-all duration-200 shrink-0 active:scale-95"
            >
              <Send className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </form>
        </div>
      )}

      {/* Read-only Notice for Announcement Groups - mobile optimized */}
      {isAnnouncement && userRole !== "Admin" && userRole !== "admin" && userRole !== "teacher" && (
        <div className="bg-orange-50 dark:bg-orange-950/20 border-t border-orange-200 dark:border-orange-800 px-4 py-3 md:px-4 md:py-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Megaphone className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                Announcement Channel
              </span>
            </div>
            <p className="text-sm text-orange-700 dark:text-orange-300 leading-relaxed">
              Only administrators and teachers can post messages here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
