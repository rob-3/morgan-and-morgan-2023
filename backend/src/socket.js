import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 1234 });

wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  ws.on('message', function message(data) {
    console.log('received: %s', data);
  });

  ws.send(JSON.stringify({
    type: 'newphonecall',
  }));
  setTimeout(() => {
    ws.send(JSON.stringify({
      type: 'summary',
      summary: "abc123",
    }));
  }, 2000);
});
