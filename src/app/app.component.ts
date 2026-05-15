// src/app/app.component.ts

import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from './chat.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  name = '';
  message = '';
  joined = false;
  messages: any[] = [];
  interval: any;
  lastMessageTime: string = '';

  constructor(private chatService: ChatService) { }

  ngOnInit(): void { }

  joinChat() {
    if (!this.name.trim()) {
      return;
    }
    this.joined = true;
    this.loadMessages();
    // Polling every 1 second
    this.interval = setInterval(() => {
      this.loadMessages();
    }, 1000);
  }

  loadMessages() {

    this.chatService
      .getMessages(this.lastMessageTime)
      .subscribe((data: any[]) => {

        if (data.length > 0) {

          // append new messages only
          this.messages.push(...data);

          // save latest timestamp
          this.lastMessageTime =
            data[data.length - 1].createdAt;

          setTimeout(() => {
            this.scrollToBottom();
          }, 100);
        }

      });
  }

  sendMessage() {

    if (!this.message.trim()) {
      return;
    }

    const data = {
      name: this.name,
      message: this.message
    };

    this.chatService.sendMessage(data).subscribe(() => {

      this.message = '';

      this.loadMessages();
    });
  }

  scrollToBottom(): void {

    try {
      this.myScrollContainer.nativeElement.scrollTop =
        this.myScrollContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }

  ngOnDestroy(): void {

    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}