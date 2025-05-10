export type Config = {
  appName: string;
  version: string;
  zosConnexion: {
    type: string;
    profil: string;
    hostname: string;
    port: number;
    user: string;
    password: string;
  };
};
