"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  MessageSquare,
  Users,
  Image,
  Megaphone,
} from "lucide-react";

interface MessageStats {
  totalMessages: number;
  textMessages: number;
  mediaMessages: number;
  announcements: number;
  avgMessageLength: number;
  uniqueUsers: number;
}

export function AnalyticsDashboard() {
  const [stats, setStats] = useState<MessageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/analytics/message-stats?days=30");
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.error || "Failed to fetch stats");
      }
    } catch (err) {
      setError("Network error occurred");
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <Button onClick={fetchStats} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 text-center text-gray-500">
        No analytics data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Chat Analytics Dashboard
        </h2>
        <Button onClick={fetchStats} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Messages
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalMessages.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
            <p className="text-xs text-muted-foreground">Unique participants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Media Messages
            </CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mediaMessages}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalMessages > 0
                ? Math.round((stats.mediaMessages / stats.totalMessages) * 100)
                : 0}
              % of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Announcements</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.announcements}</div>
            <p className="text-xs text-muted-foreground">
              Official communications
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Message Breakdown</CardTitle>
            <CardDescription>Distribution of message types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Text Messages</span>
                <Badge variant="secondary">{stats.textMessages}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Media Messages</span>
                <Badge variant="secondary">{stats.mediaMessages}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Announcements</span>
                <Badge variant="secondary">{stats.announcements}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement Metrics</CardTitle>
            <CardDescription>Message quality indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Avg Message Length</span>
                <Badge variant="outline">{stats.avgMessageLength} chars</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Messages per User</span>
                <Badge variant="outline">
                  {stats.uniqueUsers > 0
                    ? Math.round(stats.totalMessages / stats.uniqueUsers)
                    : 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Engagement Rate</span>
                <Badge variant="outline">
                  {stats.totalMessages > 0
                    ? Math.round(
                        (stats.mediaMessages / stats.totalMessages) * 100
                      )
                    : 0}
                  %
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
