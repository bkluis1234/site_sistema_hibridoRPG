export type Action = {
  path: string;
  method?: string;
  body: Record<string, unknown>;
};
export type Act = (
  suffix: string,
  body: Record<string, unknown>,
  method?: string,
) => Promise<boolean>;
export const operationId = () => crypto.randomUUID();
