"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, logoutUser, type User } from "@/app/lib/auth";
import { useUserStore } from "@/app/lib/store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getUserGroups,
  getUserDMThreads,
  getAnnouncementGroup,
  createAnnouncementGroup,
} from "@/app/lib/chat-service";
import { CreateGroupDialog } from "@/components/chat/create-group-dialog";
import { StartDMDialog } from "@/components/chat/start-dm-dialog";
import { ChatMessages } from "@/components/chat/chat-messages";
import { AddMemberDialog } from "@/components/chat/add-member-dialog";
import { GroupMembersDialog } from "@/components/chat/group-members-dialog";
import type {
  Group,
  DirectMessageThread,
  GroupMember,
} from "@/app/lib/chat-types";
import {
  MessageSquare,
  Hash,
  Trash2,
  Megaphone,
  User as UserIcon,
  LogOut,
  Plus,
  Menu,
  X,
  ArrowLeft,
} from "lucide-react";
import { getGroupMembers, deleteGroup } from "@/app/lib/chat-service";

export default function DashboardPage() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const [groups, setGroups] = useState<Group[]>([]);
  const [dmThreads, setDMThreads] = useState<DirectMessageThread[]>([]);
  const [selectedChat, setSelectedChat] = useState<{
    type: "group" | "direct";
    id: string;
    name: string;
    recipientId?: string;
  } | null>(null);
  const [userGroupRole, setUserGroupRole] = useState<"admin" | "member">(
    "member"
  );
  const [activeSection, setActiveSection] = useState<
    "Chats" | "Groups" | "Announcements"
  >("Chats");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [currentView, setCurrentView] = useState<"chatlist" | "chat">(
    "chatlist"
  );

  useEffect(() => {
    async function checkUser() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push("/login");
          return;
        }
        if (currentUser.status === "pending") {
          router.push("/pending");
          return;
        }
        setUser(currentUser);
        await loadChats(currentUser);
      } catch {
        router.push("/login");
      }
    }
    checkUser();
  }, [router, setUser]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (selectedChat && selectedChat.type === "group" && user) {
      checkUserRole(selectedChat.id, user.$id);
    }
  }, [selectedChat, user]);

  const loadChats = async (user: User) => {
    const [userGroups, userDMs] = await Promise.all([
      getUserGroups(user.$id),
      getUserDMThreads(user.$id),
    ]);

    // Ensure announcement group exists and is included
    if (user.institutionId) {
      let announcementGroup = await getAnnouncementGroup(user.institutionId);
      if (!announcementGroup) {
        announcementGroup = await createAnnouncementGroup(user.institutionId);
      }

      // Add announcement group to the groups list if not already present
      const hasAnnouncement = userGroups.some((g) => g.isAnnouncement);
      if (!hasAnnouncement && announcementGroup) {
        userGroups.unshift(announcementGroup); // Add to beginning of list
      }
    }

    setGroups(userGroups);
    setDMThreads(userDMs);
  };

  const checkUserRole = async (groupId: string, userId: string) => {
    const members = await getGroupMembers(groupId);
    const userMember = members.find((m) => m.userId === userId);
    if (userMember) {
      setUserGroupRole(userMember.role);
    }
  };

  const handleGroupCreated = () => {
    if (user) {
      loadChats(user);
    }
  };

  const handleMemberAdded = () => {
    // Refresh can be done if needed
  };

  const handleStartDM = (userId: string, username: string) => {
    setSelectedChat({
      type: "direct",
      id: userId,
      name: username,
      recipientId: userId,
    });
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this group? This cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteGroup(groupId);
      if (selectedChat?.id === groupId) {
        setSelectedChat(null);
      }
      if (user) {
        loadChats(user);
      }
    } catch (error) {
      console.error("Error deleting group:", error);
      alert("Failed to delete group");
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    router.push("/login");
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  const getDMPartner = (thread: DirectMessageThread) => {
    return thread.participant1Id === user.$id
      ? { id: thread.participant2Id, name: thread.participant2Username }
      : { id: thread.participant1Id, name: thread.participant1Username };
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* Top Navigation Bar - Always visible in collapsed state */}
        <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600 flex items-center justify-between px-2 py-2">
          <div className="flex items-center gap-2 flex-1 overflow-x-auto">
            <button
              onClick={() => {
                setActiveSection("Chats");
                setCurrentView("chatlist");
                setSelectedChat(null);
              }}
              className={`p-3 rounded-lg transition-colors ${
                activeSection === "Chats"
                  ? "bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
              title="Chats"
            >
              <MessageSquare className="h-5 w-5" />
            </button>

            <button
              onClick={() => {
                setActiveSection("Groups");
                setCurrentView("chatlist");
                setSelectedChat(null);
              }}
              className={`p-3 rounded-lg transition-colors ${
                activeSection === "Groups"
                  ? "bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
              title="Groups"
            >
              <Hash className="h-5 w-5" />
            </button>

            <button
              onClick={() => {
                setActiveSection("Announcements");
                setCurrentView("chatlist");
                setSelectedChat(null);
              }}
              className={`p-3 rounded-lg transition-colors ${
                activeSection === "Announcements"
                  ? "bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
              title="Announcements"
            >
              <Megaphone className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/profile")}
              className="p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Profile"
            >
              <UserIcon className="h-5 w-5" />
            </button>

            <button
              onClick={handleLogout}
              className="p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          {currentView === "chatlist" ? (
            // Chat List View
            <div className="h-full flex flex-col bg-white dark:bg-gray-800 relative">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                  {activeSection}
                </h2>
              </div>

              {/* Chat List */}
              <div className="flex-1 overflow-y-auto">
                {activeSection === "Chats" && (
                  <div className="p-2 space-y-1">
                    {dmThreads.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No messages yet</p>
                      </div>
                    ) : (
                      dmThreads.map((thread) => {
                        const partner = getDMPartner(thread);
                        return (
                          <button
                            key={thread.$id}
                            onClick={() => {
                              setSelectedChat({
                                type: "direct",
                                id: partner.id,
                                name: partner.name,
                                recipientId: partner.id,
                              });
                              setCurrentView("chat");
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {partner.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 dark:text-white truncate">
                                {partner.name}
                              </div>
                              {thread.lastMessageContent && (
                                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                  {thread.lastMessageContent}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}

                {activeSection === "Groups" && (
                  <div className="p-2 space-y-1">
                    {groups.filter((g) => !g.isAnnouncement).length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Hash className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No groups yet</p>
                      </div>
                    ) : (
                      groups
                        .filter((g) => !g.isAnnouncement)
                        .map((group) => (
                          <button
                            key={group.$id}
                            onClick={() => {
                              setSelectedChat({
                                type: "group",
                                id: group.$id,
                                name: group.name,
                              });
                              setCurrentView("chat");
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-white">
                              <Hash className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 dark:text-white truncate">
                                {group.name}
                              </div>
                              {group.description && (
                                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                  {group.description}
                                </div>
                              )}
                            </div>
                          </button>
                        ))
                    )}
                  </div>
                )}

                {activeSection === "Announcements" && (
                  <div className="p-2 space-y-1">
                    {groups.filter((g) => g.isAnnouncement).length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No announcements</p>
                      </div>
                    ) : (
                      groups
                        .filter((g) => g.isAnnouncement)
                        .map((group) => (
                          <button
                            key={group.$id}
                            onClick={() => {
                              setSelectedChat({
                                type: "group",
                                id: group.$id,
                                name: group.name,
                              });
                              setCurrentView("chat");
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white">
                              <Megaphone className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 dark:text-white truncate">
                                {group.name}
                              </div>
                              <div className="text-sm text-orange-600 dark:text-orange-400">
                                📢 Announcement Channel
                              </div>
                            </div>
                          </button>
                        ))
                    )}
                  </div>
                )}
              </div>

              {/* Floating Action Button for New Chat/Group */}
              {activeSection === "Chats" && user && (
                <div className="fixed bottom-6 right-6 z-50">
                  <StartDMDialog
                    institutionId={user.institutionId}
                    currentUserId={user.$id}
                    onUserSelected={(userId, username) => {
                      handleStartDM(userId, username);
                      setCurrentView("chat");
                    }}
                    isMobile={true}
                  />
                </div>
              )}
              {activeSection === "Groups" && user && (
                <div className="fixed bottom-6 right-6 z-50">
                  <CreateGroupDialog
                    institutionId={user.institutionId}
                    userId={user.$id}
                    onGroupCreated={handleGroupCreated}
                    isMobile={true}
                  />
                </div>
              )}
            </div>
          ) : (
            // Chat View
            <div className="h-full flex flex-col bg-white dark:bg-gray-900">
              {selectedChat && (
                <>
                  {/* Chat Header with Back Button */}
                  <div className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 bg-white dark:bg-gray-800">
                    <button
                      onClick={() => setCurrentView("chatlist")}
                      className="mr-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Back to chat list"
                    >
                      <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    </button>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedChat.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedChat.type === "group"
                          ? "Group Chat"
                          : "Direct Message"}
                      </p>
                    </div>
                    {selectedChat.type === "group" &&
                      user &&
                      userGroupRole === "admin" && (
                        <div className="flex gap-2">
                          <GroupMembersDialog
                            groupId={selectedChat.id}
                            isAdmin={userGroupRole === "admin"}
                            currentUserId={user.$id}
                          />
                          <AddMemberDialog
                            groupId={selectedChat.id}
                            institutionId={user.institutionId}
                            currentUserId={user.$id}
                            onMemberAdded={handleMemberAdded}
                          />
                        </div>
                      )}
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1">
                    {user && (
                      <ChatMessages
                        type={selectedChat.type}
                        chatId={selectedChat.id}
                        currentUserId={user.$id}
                        currentUsername={user.username}
                        recipientId={selectedChat.recipientId}
                        userRole={user.role}
                        isAnnouncement={
                          selectedChat.type === "group" &&
                          groups.find((g) => g.$id === selectedChat.id)
                            ?.isAnnouncement
                        }
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Left Sidebar - Navigation */}
      <div
        className={`bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600 flex flex-col transition-all duration-300 ${
          sidebarOpen ? "w-1/6" : "w-16"
        }`}
      >
        {/* Sidebar Header with Toggle Button */}
        <div className="p-4 border-b border-gray-300 dark:border-gray-600 flex items-center justify-between">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">
              ChatApp
            </h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {sidebarOpen ? (
              <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <Menu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>

        {/* User Info */}
        {sidebarOpen && (
          <div className="px-4 py-2 border-b border-gray-300 dark:border-gray-600">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {user.username}
            </p>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 p-2 space-y-1">
          <button
            onClick={() => {
              setActiveSection("Chats");
              if (isMobile) {
                setCurrentView("chatlist");
                setSelectedChat(null);
              }
            }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
              activeSection === "Chats"
                ? "bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <MessageSquare className="h-5 w-5" />
            <span className={`font-medium ${sidebarOpen ? "" : "hidden"}`}>
              Chats
            </span>
          </button>

          <button
            onClick={() => {
              setActiveSection("Groups");
              if (isMobile) {
                setCurrentView("chatlist");
                setSelectedChat(null);
              }
            }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
              activeSection === "Groups"
                ? "bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <Hash className="h-5 w-5" />
            <span className={`font-medium ${sidebarOpen ? "" : "hidden"}`}>
              Groups
            </span>
          </button>

          <button
            onClick={() => {
              setActiveSection("Announcements");
              if (isMobile) {
                setCurrentView("chatlist");
                setSelectedChat(null);
              }
            }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
              activeSection === "Announcements"
                ? "bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <Megaphone className="h-5 w-5" />
            <span className={`font-medium ${sidebarOpen ? "" : "hidden"}`}>
              Announcements
            </span>
          </button>
        </nav>

        {/* Bottom Actions */}
        <div className="p-2 border-t border-gray-300 dark:border-gray-600 space-y-1">
          <button
            onClick={() => router.push("/profile")}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
              sidebarOpen ? "" : "justify-center"
            }`}
          >
            <UserIcon className="h-5 w-5" />
            <span className={`font-medium ${sidebarOpen ? "" : "hidden"}`}>
              Profile
            </span>
          </button>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors ${
              sidebarOpen ? "" : "justify-center"
            }`}
          >
            <LogOut className="h-5 w-5" />
            <span className={`font-medium ${sidebarOpen ? "" : "hidden"}`}>
              Logout
            </span>
          </button>
        </div>
      </div>

      {/* Middle Panel - Chat/Group List */}
      <div
        className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ${
          sidebarOpen ? "w-1/4" : "w-1/3"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
            {activeSection}
          </h2>
          {activeSection === "Chats" && user && (
            <StartDMDialog
              institutionId={user.institutionId}
              currentUserId={user.$id}
              onUserSelected={handleStartDM}
            />
          )}
          {activeSection === "Groups" && user && (
            <CreateGroupDialog
              institutionId={user.institutionId}
              userId={user.$id}
              onGroupCreated={handleGroupCreated}
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeSection === "Chats" && (
            <div className="p-2 space-y-1">
              {dmThreads.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No messages yet</p>
                </div>
              ) : (
                dmThreads.map((thread) => {
                  const partner = getDMPartner(thread);
                  return (
                    <button
                      key={thread.$id}
                      onClick={() => {
                        setSelectedChat({
                          type: "direct",
                          id: partner.id,
                          name: partner.name,
                          recipientId: partner.id,
                        });
                        if (isMobile) setCurrentView("chat");
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                        selectedChat?.id === partner.id
                          ? "bg-blue-100 dark:bg-blue-900"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {partner.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {partner.name}
                        </div>
                        {thread.lastMessageContent && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {thread.lastMessageContent}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {activeSection === "Groups" && (
            <div className="p-2 space-y-1">
              {groups.filter((g) => !g.isAnnouncement).length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Hash className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No groups yet</p>
                </div>
              ) : (
                groups
                  .filter((g) => !g.isAnnouncement)
                  .map((group) => (
                    <button
                      key={group.$id}
                      onClick={() => {
                        setSelectedChat({
                          type: "group",
                          id: group.$id,
                          name: group.name,
                        });
                        if (isMobile) setCurrentView("chat");
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                        selectedChat?.id === group.$id
                          ? "bg-blue-100 dark:bg-blue-900"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-white">
                        <Hash className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {group.name}
                        </div>
                        {group.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {group.description}
                          </div>
                        )}
                      </div>
                    </button>
                  ))
              )}
            </div>
          )}

          {activeSection === "Announcements" && (
            <div className="p-2 space-y-1">
              {groups.filter((g) => g.isAnnouncement).length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No announcements</p>
                </div>
              ) : (
                groups
                  .filter((g) => g.isAnnouncement)
                  .map((group) => (
                    <button
                      key={group.$id}
                      onClick={() => {
                        setSelectedChat({
                          type: "group",
                          id: group.$id,
                          name: group.name,
                        });
                        if (isMobile) setCurrentView("chat");
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                        selectedChat?.id === group.$id
                          ? "bg-blue-100 dark:bg-blue-900"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white">
                        <Megaphone className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {group.name}
                        </div>
                        <div className="text-sm text-orange-600 dark:text-orange-400">
                          📢 Announcement Channel
                        </div>
                      </div>
                    </button>
                  ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Chat Area (3/4 width) */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 bg-white dark:bg-gray-800">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedChat.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedChat.type === "group"
                    ? "Group Chat"
                    : "Direct Message"}
                </p>
              </div>
              {selectedChat.type === "group" && user && (
                <div className="flex gap-2">
                  <GroupMembersDialog
                    groupId={selectedChat.id}
                    isAdmin={userGroupRole === "admin"}
                    currentUserId={user.$id}
                  />
                  {userGroupRole === "admin" && (
                    <>
                      <AddMemberDialog
                        groupId={selectedChat.id}
                        institutionId={user.institutionId}
                        currentUserId={user.$id}
                        onMemberAdded={handleMemberAdded}
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteGroup(selectedChat.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Chat Messages */}
            <div className="flex-1">
              {user && (
                <ChatMessages
                  type={selectedChat.type}
                  chatId={selectedChat.id}
                  currentUserId={user.$id}
                  currentUsername={user.username}
                  recipientId={selectedChat.recipientId}
                  userRole={user.role}
                  isAnnouncement={
                    selectedChat.type === "group" &&
                    groups.find((g) => g.$id === selectedChat.id)
                      ?.isAnnouncement
                  }
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">
                Select a conversation
              </h3>
              <p className="text-sm">
                Choose a chat from the {activeSection} list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
