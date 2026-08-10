import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";
import { Filter, Plus, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingState } from "@/components/ui/loading";
import { IssueCard } from "@/components/issues";
import {
  UserAvatar,
  TagBadge,
  EmptyIssues,
  EmptySearchResults,
} from "@/components/common";
import { StatCard } from "@/components/common/StatCard";
import { useToast } from "@/hooks/useToast";
import { issuesApi, usersApi, tagsApi } from "@/lib/api";
import type { Issue, User, Tag } from "@/types";

interface IssueFilters {
  search?: string;
  status?: string;
  assignedUserId?: string;
  tagId?: string;
  page?: number;
  limit?: number;
}

export default function IssueListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const filters: IssueFilters = useMemo(
    () => ({
      search: searchParams.get("search") || "",
      status: searchParams.get("status") || "",
      assignedUserId: searchParams.get("assignedUserId") || "",
      tagId: searchParams.get("tagId") || "",
      page: parseInt(searchParams.get("page") || "1"),
      limit: 10,
    }),
    [searchParams],
  );

  const updateFilters = (newFilters: Partial<IssueFilters>) => {
    const params = new URLSearchParams(searchParams);

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== "") {
        params.set(key, value.toString());
      } else {
        params.delete(key);
      }
    });

    if (!("page" in newFilters)) {
      params.delete("page");
      setCurrentPage(1);
    }

    setSearchParams(params);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const apiFilters = {
        search: filters.search || undefined,
        status:
          !filters.status || filters.status === "all"
            ? undefined
            : filters.status,
        assigned_user_id:
          !filters.assignedUserId ||
          filters.assignedUserId === "all" ||
          filters.assignedUserId === "unassigned"
            ? undefined
            : filters.assignedUserId,
        tag_id:
          !filters.tagId || filters.tagId === "all"
            ? undefined
            : filters.tagId,
        page: filters.page,
        limit: filters.limit,
      };

      const [issuesResponse, usersResponse, tagsResponse] = await Promise.all([
        issuesApi.getIssues(apiFilters),
        usersApi.getUsers(),
        tagsApi.getTags(),
      ]);

      setIssues(issuesResponse.data || []);
      const total = issuesResponse.pagination?.total ?? issuesResponse.data?.length ?? 0;
      const limit = issuesResponse.pagination?.limit ?? filters.limit ?? 10;
      const page = filters.page || 1;
      setTotalCount(total);
      setTotalPages(Math.max(1, Math.ceil(total / limit)));
      setCurrentPage(page);
      setUsers(usersResponse.data || []);
      setTags(tagsResponse.data || []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      const errorMessage = "Failed to load issues. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = Boolean(
    filters.search || filters.status || filters.assignedUserId || filters.tagId,
  );

  const pageStats = useMemo(() => {
    return {
      open: issues.filter((i) => i.status !== "done").length,
      done: issues.filter((i) => i.status === "done").length,
      high: issues.filter(
        (i) => i.priority === "high" || i.priority === "urgent",
      ).length,
    };
  }, [issues]);

  if (loading) {
    return <LoadingState message="Loading issues..." />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Issues
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Filter, triage, and ship work from one board.
          </p>
        </div>
        <Button asChild>
          <Link to="/issues/new" className="gap-2">
            <Plus className="h-4 w-4" />
            Create issue
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Matching total" value={totalCount} tone="teal" />
        <StatCard
          label="Open on this page"
          value={pageStats.open}
          tone="sky"
        />
        <StatCard
          label="High priority on page"
          value={pageStats.high}
          tone="amber"
        />
      </div>

      <Card className="dashboard-panel shadow-panel border-0">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4 text-muted-foreground" />
            Filters
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by title or description..."
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Select
              value={filters.status || "all"}
              onValueChange={(value) =>
                updateFilters({ status: value === "all" ? "" : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.assignedUserId || "all"}
              onValueChange={(value) =>
                updateFilters({
                  assignedUserId: value === "all" ? "" : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <UserAvatar user={user} size="sm" />
                      <span>{user.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.tagId || "all"}
              onValueChange={(value) =>
                updateFilters({ tagId: value === "all" ? "" : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tags</SelectItem>
                {tags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id.toString()}>
                    <TagBadge tag={tag} variant="outline" />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters ? (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              className="mt-2"
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-3">
        {issues.length === 0 ? (
          hasActiveFilters ? (
            <EmptySearchResults />
          ) : (
            <EmptyIssues onCreateIssue={() => navigate("/issues/new")} />
          )
        ) : (
          issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} showActions />
          ))
        )}
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            disabled={currentPage <= 1}
            onClick={() => updateFilters({ page: currentPage - 1 })}
          >
            Previous
          </Button>
          <span className="px-3 text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage >= totalPages}
            onClick={() => updateFilters({ page: currentPage + 1 })}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
