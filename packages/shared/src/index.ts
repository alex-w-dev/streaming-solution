export interface ExampleMessage {
  id: string;
  payload: string;
  createdAt: string;
}

export const formatMessage = (msg: ExampleMessage): string =>
  `[${msg.createdAt}] (${msg.id}) ${msg.payload}`;


