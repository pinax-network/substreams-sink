import { Logger, type ILogObj } from "tslog";

class SinkLogger extends Logger<ILogObj> {
  super() {
    this.settings.type = "hidden";
  }

  public setName(name: string) {
    this.settings.name = name;
  }

  public enable() {
    this.settings.type = "pretty";
  }
}

export const logger = new SinkLogger();