declare namespace chrome {
  namespace tabs {
    interface Tab {
      id?: number;
      windowId?: number;
      title?: string;
      url?: string;
      status?: "loading" | "complete";
    }

    function query(queryInfo: { active: boolean; currentWindow: boolean }): Promise<Tab[]>;
    function create(createProperties: { active?: boolean; url?: string }): Promise<Tab>;
    function get(tabId: number): Promise<Tab>;

    namespace onUpdated {
      function addListener(
        callback: (
          tabId: number,
          changeInfo: { status?: "loading" | "complete"; url?: string },
          tab: Tab,
        ) => void,
      ): void;
    }

    namespace onRemoved {
      function addListener(callback: (tabId: number) => void): void;
    }
  }

  namespace scripting {
    interface InjectionResult<Result> {
      frameId: number;
      result?: Result;
    }

    interface ScriptInjection<Args extends unknown[], Result> {
      target: { tabId: number };
      func: (...args: Args) => Result | Promise<Result>;
      args: Args;
    }

    function executeScript<Args extends unknown[], Result>(
      injection: ScriptInjection<Args, Result>,
    ): Promise<Array<InjectionResult<Result>>>;
  }

  namespace runtime {
    const id: string;

    interface MessageSender {
      id?: string;
    }

    function sendMessage<Response = unknown>(message: unknown): Promise<Response>;

    namespace onMessage {
      function addListener(
        callback: (message: unknown, sender: MessageSender, sendResponse: (response: unknown) => void) => boolean | void,
      ): void;
    }
  }

  namespace storage {
    interface StorageArea {
      get(keys: string | string[] | null): Promise<Record<string, unknown>>;
      set(items: Record<string, unknown>): Promise<void>;
      remove(keys: string | string[]): Promise<void>;
    }

    const session: StorageArea;
  }

  namespace action {
    function openPopup(options?: { windowId?: number }): Promise<void>;
    function setBadgeBackgroundColor(details: { tabId?: number; color: string }): Promise<void>;
    function setBadgeText(details: { tabId?: number; text: string }): Promise<void>;
    function setTitle(details: { tabId?: number; title: string }): Promise<void>;
  }

  namespace permissions {
    interface Permissions {
      origins?: string[];
    }

    function contains(permissions: Permissions): Promise<boolean>;
    function request(permissions: Permissions): Promise<boolean>;
  }
}
