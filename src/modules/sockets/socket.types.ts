// socket.types.ts
export interface JoinRoomPayload {
  roomId: string;
}

export interface NewMessagePayload {
  roomId: string;
  message: string;
}
