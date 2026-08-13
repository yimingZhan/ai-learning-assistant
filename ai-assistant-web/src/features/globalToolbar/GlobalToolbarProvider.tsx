import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toolbarApi } from "../../api/client";
import type {
  CurrentUser,
  RenewalAssistantFocus,
  WorkReminderSummary,
} from "../../api/contracts";

export type AssistantSurface = "sidebar" | "embedded";

const ASSISTANT_OPEN_SESSION_KEY = "weixun-ai-assistant-open";

function getStoredAssistantOpen() {
  if (typeof window === "undefined") return undefined;
  try {
    const stored = window.sessionStorage.getItem(ASSISTANT_OPEN_SESSION_KEY);
    if (stored === "true") return true;
    if (stored === "false") return false;
  } catch {
    return undefined;
  }
  return undefined;
}

function storeAssistantOpen(open: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(ASSISTANT_OPEN_SESSION_KEY, String(open));
  } catch {
    // sessionStorage may be unavailable in restricted browser environments.
  }
}

export type AssistantBusinessContext =
  | {
      kind: "complaintRisk";
      studentId: string;
      studentName: string;
    }
  | {
      kind: "renewal";
      studentId: string;
      studentName: string;
      diagnosedAt?: string;
      focus?: RenewalAssistantFocus;
    };

type GlobalToolbarContextValue = {
  currentUser?: CurrentUser;
  currentUserLoading: boolean;
  reminders?: WorkReminderSummary;
  remindersLoading: boolean;
  remindersError?: string;
  reloadReminders: () => Promise<void>;
  markReminderRead: (reminderId: string) => Promise<void>;
  assistantSurface: AssistantSurface;
  assistantOpen: boolean;
  assistantActive: boolean;
  assistantContext?: AssistantBusinessContext;
  assistantFocusRequest: number;
  registerAssistantSurface: (
    surface: AssistantSurface,
    options?: { defaultOpen?: boolean },
  ) => void;
  unregisterAssistantSurface: (surface: AssistantSurface) => void;
  setAssistantContext: (context?: AssistantBusinessContext) => void;
  setAssistantOpen: (open: boolean) => void;
  openAssistant: () => void;
  triggerAssistant: () => void;
};

const GlobalToolbarContext = createContext<GlobalToolbarContextValue | null>(
  null,
);

export function GlobalToolbarProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser>();
  const [currentUserLoading, setCurrentUserLoading] = useState(true);
  const [reminders, setReminders] = useState<WorkReminderSummary>();
  const [remindersLoading, setRemindersLoading] = useState(true);
  const [remindersError, setRemindersError] = useState<string>();
  const [assistantSurface, setAssistantSurface] =
    useState<AssistantSurface>("sidebar");
  const storedAssistantOpen = useRef(getStoredAssistantOpen());
  const hasAssistantOpenPreference = useRef(
    storedAssistantOpen.current !== undefined,
  );
  const [assistantOpen, setAssistantOpenState] = useState(
    storedAssistantOpen.current ?? false,
  );
  const [assistantContext, setAssistantContext] =
    useState<AssistantBusinessContext>();
  const [assistantFocusRequest, setAssistantFocusRequest] = useState(0);

  useEffect(() => {
    toolbarApi
      .getCurrentUser()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(undefined))
      .finally(() => setCurrentUserLoading(false));
  }, []);

  const reloadReminders = useCallback(async () => {
    setRemindersLoading(true);
    setRemindersError(undefined);
    try {
      setReminders(await toolbarApi.getWorkReminders());
    } catch {
      setRemindersError("工作提醒加载失败");
    } finally {
      setRemindersLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadReminders();
  }, [reloadReminders]);

  const markReminderRead = useCallback(async (reminderId: string) => {
    setReminders(await toolbarApi.markReminderRead(reminderId));
  }, []);

  const registerAssistantSurface = useCallback(
    (
      surface: AssistantSurface,
      options?: { defaultOpen?: boolean },
    ) => {
      setAssistantSurface(surface);
      if (
        !hasAssistantOpenPreference.current &&
        options?.defaultOpen !== undefined
      ) {
        setAssistantOpenState(options.defaultOpen);
      }
    },
    [],
  );

  const unregisterAssistantSurface = useCallback(
    (surface: AssistantSurface) => {
      setAssistantSurface((current) =>
        current === surface ? "sidebar" : current,
      );
      setAssistantContext(undefined);
    },
    [],
  );

  const setAssistantOpen = useCallback((open: boolean) => {
    hasAssistantOpenPreference.current = true;
    storeAssistantOpen(open);
    setAssistantOpenState(open);
  }, []);

  const openAssistant = useCallback(() => {
    hasAssistantOpenPreference.current = true;
    storeAssistantOpen(true);
    setAssistantOpenState(true);
    setAssistantFocusRequest((current) => current + 1);
  }, []);

  const triggerAssistant = useCallback(() => {
    hasAssistantOpenPreference.current = true;
    setAssistantOpenState((current) => {
      const next = !current;
      storeAssistantOpen(next);
      return next;
    });
    setAssistantFocusRequest((current) => current + 1);
  }, []);

  const value = useMemo<GlobalToolbarContextValue>(
    () => ({
      currentUser,
      currentUserLoading,
      reminders,
      remindersLoading,
      remindersError,
      reloadReminders,
      markReminderRead,
      assistantSurface,
      assistantOpen,
      assistantActive: assistantOpen,
      assistantContext,
      assistantFocusRequest,
      registerAssistantSurface,
      unregisterAssistantSurface,
      setAssistantContext,
      setAssistantOpen,
      openAssistant,
      triggerAssistant,
    }),
    [
      assistantContext,
      assistantFocusRequest,
      assistantOpen,
      assistantSurface,
      currentUser,
      currentUserLoading,
      markReminderRead,
      openAssistant,
      registerAssistantSurface,
      reloadReminders,
      reminders,
      remindersError,
      remindersLoading,
      triggerAssistant,
      unregisterAssistantSurface,
    ],
  );

  return (
    <GlobalToolbarContext.Provider value={value}>
      {children}
    </GlobalToolbarContext.Provider>
  );
}

export function useGlobalToolbar() {
  const context = useContext(GlobalToolbarContext);
  if (!context) {
    throw new Error("useGlobalToolbar must be used inside GlobalToolbarProvider");
  }
  return context;
}

export function useOptionalGlobalToolbar() {
  return useContext(GlobalToolbarContext);
}
