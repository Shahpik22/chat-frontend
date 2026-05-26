// src/app/chat.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  // CHANGE THIS TO YOUR BACKEND URL
  // private API = 'http://localhost:3000';
  // private API = 'https://chat-backend-phi-three.vercel.app';
  private API = 'https://chat-backend-k8kz.onrender.com';

  constructor(private http: HttpClient) { }

  //   getMessages(after?: string) {
  //   let url = `${this.API}/messages`;
  //   if (after) {
  //     url += `?after=${after}`;
  //   }
  //   return this.http.get<any[]>(url);
  // }

  // getMessages(after?: string) {
  //   let url = `${this.API}/messages`;
  //   if (after && after !== '') {
  //     url += `?after=${after}`;
  //   }
  //   return this.http.get<any[]>(url);
  // }

  getMessages(roomId: string) {
    return this.http.get<any[]>(
      `${this.API}/messages/${roomId}`
    );
  }

  // sendMessage(data: any) {
  //   return this.http.post(`${this.API}/messages`, data);
  // }
  sendMessage(data: any) {
    return this.http.post(`${this.API}/messages`, data);
  }

  getOnlineUsers(data: any) {
    return this.http.get<any[]>(`${this.API}/online-users/${data}`);
  }

  heartbeat(name: string) {
    return this.http.post(`${this.API}/heartbeat/${name}`, {});
  }

  markAsRead(roomId: string, name: string) {
    return this.http.put(
      `${this.API}/messages/read/${roomId}/${name}`,
      {}
    );
  }

  // ---------------- VIEW ONCE ----------------
  markViewOnce(messageId: string, user: string) {
    return this.http.post(
      `${this.API}/messages/view-once`,
      {
        messageId,
        user
      }
    );
  }
}