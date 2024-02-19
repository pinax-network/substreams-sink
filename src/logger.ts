import { Logger, type ILogObj } from "tslog";

class SinkLogger extends Logger<ILogObj> {
  constructor() {
    super({
      prettyLogTemplate: "{{yyyy}}.{{mm}}.{{dd}} {{hh}}:{{MM}}:{{ss}}\t{{logLevelName}}\t{{name}}\t"
    });
    this.disable();
    this.setName("substreams-sink");
  }

  public setName(name: string) {
    this.settings.name = name;
  }

  public enable(type: "json" | "pretty" = "pretty") {
    this.settings.type = type;
    this.settings.minLevel = 0;
  }

  public disable() {
    this.settings.type = "hidden";
    this.settings.minLevel = 5;
  }

  public info(...info: unknown[]) {
    const messages = info.map((i) => (typeof i === "string" ? i : JSON.stringify(i)));
    return super.info(...messages);
  }

  public error(...err: unknown[]) {
    const errors = err.map((e) => (typeof e === "string" ? e : JSON.stringify(e)));
    return super.error(...errors);
  }
}

export const logger = new SinkLogger();