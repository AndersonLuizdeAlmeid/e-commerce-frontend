import { apiRequest } from "@/shared/api/browser-client";
import type { components } from "@/shared/api/schema";

// Endereços do cliente (RF-007, arquivo 07 §3) e consulta de CEP (arquivo 22 §4.4).

type Schemas = components["schemas"];

export type Address = Schemas["AddressResponse"];
export type AddressRequest = Schemas["AddressRequest"];
export type PostalAddress = Schemas["PostalAddress"];

const PATH = "/api/v1/me/addresses";

export const addressesApi = {
  list: () => apiRequest<Address[]>(PATH, { auth: true }),
  create: (request: AddressRequest) => apiRequest<Address>(PATH, { method: "POST", body: request, auth: true }),
  update: (id: string, request: AddressRequest) => apiRequest(`${PATH}/${id}`, { method: "PUT", body: request, auth: true }),
  remove: (id: string) => apiRequest(`${PATH}/${id}`, { method: "DELETE", auth: true }),
  setDefault: (id: string) => apiRequest(`${PATH}/${id}/default`, { method: "PUT", auth: true }),
  /** 404: CEP não existe. 503: serviço fora; o cliente preenche à mão. */
  lookupPostalCode: (postalCode: string) =>
    apiRequest<PostalAddress>(`/api/v1/shipping/postal-codes/${postalCode.replace(/\D/g, "")}`),
};
