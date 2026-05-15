// src/app/chat.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  // CHANGE THIS TO YOUR BACKEND URL
  // private API = 'http://localhost:3000';
 private API = 'https://chat-backend-phi-three.vercel.app';
  
  constructor(private http: HttpClient) {}

  getMessages(after?: string) {
  let url = `${this.API}/messages`;
  if (after) {
    url += `?after=${after}`;
  }
  return this.http.get<any[]>(url);
}

  sendMessage(data: any) {
    return this.http.post(`${this.API}/messages`, data);
  }
}