import { WebClient } from "@slack/web-api";

const initializeSlackClient = (token: string) => {
  return new WebClient(token);
};

export { initializeSlackClient };
