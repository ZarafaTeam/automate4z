export type Step = {
  name: string;
  action: string;
  with?: Record<string, any>;
  if?: any;
  active?: any;
  forEach?: any;
  steps?: Step[]; // pour control.for-each
  output?: Record<string, string>;
};
