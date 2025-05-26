export type Connection = {
    name: string;
    type: string;
    profile: string;
    hostname: string;
    port: number;
    user: string;
    password: string;
}

export type Config = {
  appName: string;
  version: string;
  zosConnection: Connection[];
  defaultZosConnection: string;
};
