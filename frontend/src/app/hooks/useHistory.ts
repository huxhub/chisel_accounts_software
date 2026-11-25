import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../../services/config";
import type { AttachedDoc } from "../types";
import { formatLocalDate } from "../types";

export interface HistoryTransaction {
  id: string;
  date: string;
  description: string;
  type: "credit" | "debit";
  amount: number;
  reference?: string;
  document?: AttachedDoc;
  dueDate?: string;
  exchangeType?: "loan" | "credit";
  isCompleted?: boolean;
  isReminder?: boolean;
  programId?: number | null;
  programName?: string | null;
  accountId: string;
  accountName: string;
  accountType: string;
  accountColor: string;
  accountBgColor: string;
}

export interface AccountSummary {
  accountId: string;
  name: string;
  type: string;
  color: string;
  bgColor: string;
  openingBalance: number;
  credits: number;
  debits: number;
  balance: number;
}

export interface HistorySummary {
  totalCredits: number;
  totalDebits: number;
  netBalance: number;
  totalOpeningBalance: number;
  totalClosingBalance: number;
  byAccount: AccountSummary[];
}

export interface HistoryFilters {
  preset: "all" | "today" | "this_week" | "this_month" | "this_quarter" | "this_year";
  startDate: string;
  endDate: string;
  month: string;
  accountId: string;
  type: string;
  programId: string;
}

const defaultFilters: HistoryFilters = {
  preset: "all",
  startDate: "",
  endDate: "",
  month: "",
  accountId: "",
  type: "",
  programId: "",
};

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = localStorage.getItem("auth_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

function computePresetDates(preset: HistoryFilters["preset"]): { startDate: string; endDate: string } {
  if (preset === "all") return { startDate: "", endDate: "" };

  const now = new Date();
  const todayStr = formatLocalDate(now);

  if (preset === "today") {
    return { startDate: todayStr, endDate: todayStr };
  }

  if (preset === "this_week") {
    const day = now.getDay();
    const diffToMon = now.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(now.getFullYear(), now.getMonth(), diffToMon);
    const sun = new Date(now.getFullYear(), now.getMonth(), diffToMon + 6);
    return {
      startDate: formatLocalDate(mon),
      endDate: formatLocalDate(sun),
    };
  }

  if (preset === "this_month") {
    const y = now.getFullYear();
    const m = now.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    return {
      startDate: formatLocalDate(first),
      endDate: formatLocalDate(last),
    };
  }

  if (preset === "this_quarter") {
    const y = now.getFullYear();
    const m = now.getMonth();
    const qStartMonth = Math.floor(m / 3) * 3;
    const first = new Date(y, qStartMonth, 1);
    const last = new Date(y, qStartMonth + 3, 0);
    return {
      startDate: formatLocalDate(first),
      endDate: formatLocalDate(last),
    };
  }

  if (preset === "this_year") {
    const y = now.getFullYear();
    return {
      startDate: `${y}-01-01`,
      endDate: `${y}-12-31`,
    };
  }

  return { startDate: "", endDate: "" };
}

export function useHistory() {
  const [filters, setFilters] = useState<HistoryFilters>(defaultFilters);
  const [transactions, setTransactions] = useState<HistoryTransaction[]>([]);
  const [summary, setSummary] = useState<HistorySummary>({
    totalCredits: 0,
    totalDebits: 0,
    netBalance: 0,
    totalOpeningBalance: 0,
    totalClosingBalance: 0,
    byAccount: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (currentFilters: HistoryFilters) => {
    setLoading(true);
    setError(null);

    let { startDate, endDate } = currentFilters;
    if (currentFilters.preset !== "all" && !currentFilters.startDate && !currentFilters.endDate && !currentFilters.month) {
      const dates = computePresetDates(currentFilters.preset);
      startDate = dates.startDate;
      endDate = dates.endDate;
    }

    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (currentFilters.month) params.set("month", currentFilters.month);
    if (currentFilters.accountId) params.set("accountId", currentFilters.accountId);
    if (currentFilters.type) params.set("type", currentFilters.type);
    if (currentFilters.programId) params.set("programId", currentFilters.programId);

    try {
      const res = await fetch(`${API_BASE_URL}/api/accounts/history?${params.toString()}`, {
        headers: getHeaders(),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Failed to load history (${res.status})`);
      }

      const data = await res.json();
      setTransactions(data.transactions || []);
      setSummary(data.summary || {
        totalCredits: 0,
        totalDebits: 0,
        netBalance: 0,
        totalOpeningBalance: 0,
        totalClosingBalance: 0,
        byAccount: [],
      });
    } catch (err: any) {
      setError(err.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(filters);
  }, [filters, fetchHistory]);

  const updateFilter = (key: keyof HistoryFilters, value: string) => {
    setFilters(prev => {
      const updated = { ...prev, [key]: value };

      if (key === "preset" && value !== "all") {
        updated.startDate = "";
        updated.endDate = "";
        updated.month = "";
      } else if (key === "startDate" || key === "endDate" || key === "month") {
        if (value) {
          updated.preset = "all";
        }
      }

      return updated;
    });
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
  };

  return {
    filters,
    updateFilter,
    clearFilters,
    transactions,
    summary,
    loading,
    error,
    refetch: () => fetchHistory(filters),
  };
}
