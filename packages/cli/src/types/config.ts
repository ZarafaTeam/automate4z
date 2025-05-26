export type Connection = {
  name: string;
  type: "zowe" | "basic";
  profile?: string;
  hostname?: string;
  port?: number;
  user?: string;
  password?: string;
};

export type Config = {
  appName: string;
  version: string;
  zosConnection: Connection[];
  defaultZosConnection: string;
};
