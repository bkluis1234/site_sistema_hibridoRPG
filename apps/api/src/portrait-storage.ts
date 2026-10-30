/** Contrato para storage persistente externo. Nenhum arquivo é aceito antes da configuração. */
export interface PortraitStorage {
  put(input: {
    key: string;
    bytes: Uint8Array;
    contentType: "image/png" | "image/jpeg" | "image/webp";
  }): Promise<void>;
  signedReadUrl(key: string, expiresInSeconds: number): Promise<string>;
  remove(key: string): Promise<void>;
}
export const PORTRAIT_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;
// A implementação futura deve validar assinatura/decodificação, remover metadados e usar autorização da ficha.
