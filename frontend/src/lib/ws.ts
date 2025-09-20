const ws = new WebSocket("ws://localhost:8000/ws");

ws.onerror = (e) => console.error(e);
ws.onopen = () => {
  console.log("websocket connected");
};
export { ws };
