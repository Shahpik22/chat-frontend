import { Injectable } from '@angular/core';

import {
  io,
  Socket
} from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  socket: Socket;

  constructor() {

    this.socket = io(
      'http://localhost:3000',
      // 'https://your-render-app.onrender.com',

      {
        transports: ['websocket'],

        reconnection: true,

        reconnectionAttempts: Infinity,

        reconnectionDelay: 1000
      }
    );

    /* =========================
       CONNECT
    ========================= */

    this.socket.on('connect', () => {

      console.log(
        'Socket connected:',
        this.socket.id
      );
    });

    /* =========================
       DISCONNECT
    ========================= */

    this.socket.on('disconnect', () => {

      console.log(
        'Socket disconnected'
      );
    });
  }

  /* =========================
     JOIN ROOM
  ========================= */

  joinRoom(roomId: string) {

    this.socket.emit(
      'join-room',
      roomId
    );
  }

  /* =========================
     SEND MESSAGE
  ========================= */

  sendMessage(data: any) {

    this.socket.emit(
      'send-message',
      data
    );
  }

  /* =========================
     RECEIVE MESSAGE
  ========================= */

  onMessage(callback: any) {

    this.socket.on(
      'new-message',
      callback
    );
  }

  /* =========================
     READ MESSAGE
  ========================= */

  readMessage(
    roomId: string,
    name: string
  ) {

    this.socket.emit(
      'read-message',
      {
        roomId,
        name
      }
    );
  }

  /* =========================
     VIEW ONCE
  ========================= */

  viewOnce(
    messageId: string,
    user: string
  ) {

    this.socket.emit(
      'view-once',
      {
        messageId,
        user
      }
    );
  }

  /* =========================
     HEARTBEAT
  ========================= */

  heartbeat(name: string) {

    this.socket.emit(
      'heartbeat',
      name
    );
  }

  /* =========================
     TYPING
  ========================= */

  typing(
    roomId: string,
    name: string
  ) {

    this.socket.emit(
      'typing',
      {
        roomId,
        name
      }
    );
  }

  onTyping(callback: any) {

    this.socket.on(
      'user-typing',
      callback
    );
  }

  /* =========================
     ONLINE STATUS
  ========================= */

  onOnlineStatus(callback: any) {

    this.socket.on(
      'user-online',
      callback
    );
  }

  /* =========================
     READ RECEIPT
  ========================= */

  onReadReceipt(callback: any) {
console.log("masuk sini");
    this.socket.on(
      'messages-read',
      callback
    );
  }

  /* =========================
     VIEW ONCE UPDATE
  ========================= */

  onViewOnceUpdate(callback: any) {

    this.socket.on(
      'view-once-updated',
      callback
    );
  }

  /* =========================
     SOCKET ERROR
  ========================= */

  onError(callback: any) {

    this.socket.on(
      'error-message',
      callback
    );
  }

  /* =========================
     DISCONNECT SOCKET
  ========================= */

  disconnect() {

    this.socket.disconnect();
  }
}