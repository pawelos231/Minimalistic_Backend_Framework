import { RequestType } from "../interfaces/serverInterface";
export function isRequestTypeValid(str: string): str is RequestType {
  const requestTypes: RequestType[] = ["get", "post", "put", "delete", "patch"];

  return requestTypes.includes(str as RequestType);
}
