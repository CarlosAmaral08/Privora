declare namespace chrome {
  namespace tabs {
    interface Tab {
      id?: number;
      title?: string;
      url?: string;
    }

    function query(queryInfo: { active: boolean; currentWindow: boolean }): Promise<Tab[]>;
  }

  namespace scripting {
    interface InjectionResult<Result> {
      frameId: number;
      result?: Result;
    }

    interface ScriptInjection<Args extends unknown[], Result> {
      target: { tabId: number };
      func: (...args: Args) => Result;
      args: Args;
    }

    function executeScript<Args extends unknown[], Result>(
      injection: ScriptInjection<Args, Result>,
    ): Promise<Array<InjectionResult<Result>>>;
  }
}
