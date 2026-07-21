import SockJS from 'sockjs-client';

interface MessagePayload {
  type: string;
  messages: any[];
  userId: string;
  message: any;
}

interface Transport {
  start(serverUrl: string): Promise<void>;
  send(message: any, userId: string): Promise<void>;
}

let client: SockJS;

const transport: Transport = {
  async start(serverUrl: string) {
    client = new SockJS(serverUrl);

    client.onopen = () => {
      console.log(`Connected to notification server on ${serverUrl}`);
    };

    client.onmessage = (e: MessageEvent) => {
      const message = JSON.parse(e.data);
      // handle message here if needed
    };

    client.onclose = () => {
      setTimeout(() => {
        this.start(serverUrl);
      }, 5000);
    };
  },

  async send(message: any, userId: string): Promise<void> {
    client.send(JSON.stringify(message));
  }
};

class SockJsClient {
  private serverUrl: string;

  constructor(serverUrl: string = process.env.WEB_SOCKET_SERVER_URL || '') {
    this.serverUrl = serverUrl;
    transport.start(this.serverUrl);
  }

  async notificationUninstalledAgent(message: any, userId: string): Promise<void> {
    const payload: MessagePayload = {
      type: 'usbAlert',
      messages: [message],
      userId,
      message
    };
    await transport.send(payload, userId);
  }
}

export default new SockJsClient();
