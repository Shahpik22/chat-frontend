import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from './chat.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  // login user
  name = '';
  joined = false;

  // chat target user
  chatUser = 'Syah';

  // room system
  roomId = '';

  // chat
  message = '';
  messages: any[] = [];

  interval: any;
  lastMessageTime: string = '';
  onlineUsers: string[] = [];

  isDisabled = true;
  status = 'Offline'
  constructor(private chatService: ChatService) { }

  // ---------------- LOGIN ----------------
  joinChat() {
    if (!this.name.trim()) return;

    this.joined = true;
    if (this.name == 'Syah') {
      this.isDisabled = false;
    }

    this.startHeartbeat();
    this.loadOnlineUsers(this.chatUser);

    setInterval(() => {
      this.loadMessages();
      this.loadOnlineUsers(this.chatUser);
    }, 3000);
  }

  // ---------------- CREATE ROOM ----------------
  createRoom() {

    if (!this.chatUser.trim()) return;

    const users = [this.name, this.chatUser].sort();

    this.roomId = users.join('_');

    this.loadMessages();

    // polling
    this.interval = setInterval(() => {
      this.loadMessages();
    }, 1500);
  }

  // ---------------- LOAD MESSAGES ----------------
  loadMessages() {

    if (!this.roomId) return;

    this.chatService.getMessages(this.roomId)
      .subscribe((data: any[]) => {

        data.forEach((msg: any) => {

          const exists = this.messages.some(
            m => m._id === msg._id
          );

          if (!exists) {
            this.messages.push(msg);
          }
        });

        if (data.length > 0) {

          this.lastMessageTime =
            data[data.length - 1].createdAt;

          setTimeout(() => {
            this.scrollToBottom();
          }, 100);
        }
      });
  }


  // ---------------- SEND MESSAGE ----------------
  sendMessage() {

    if (!this.message.trim()) return;

    const data = {
      roomId: this.roomId,
      name: this.name,
      message: this.message
    };

    this.chatService.sendMessage(data)
      .subscribe(() => {
        this.message = '';
        this.loadMessages();
      });
  }

  // ---------------- SCROLL ----------------
  scrollToBottom() {
    try {
      const el = document.querySelector('.messages');
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    } catch { }
  }

  startHeartbeat() {

    setInterval(() => {

      this.chatService.heartbeat(this.name)
        .subscribe();

    }, 5000); // every 5 seconds
  }
  // loadOnlineUsers(user: any) {

  //   this.chatService.getOnlineUsers(user)
  //     .subscribe((users: any) => {
  //       this.onlineUsers = users;

  //       if(this.onlineUsers.status){

  //       this.status ='Online'
  //       }else{
  //         this.status ='Offline'
  //       }
  //     });
  // }

  loadOnlineUsers(user: any) {

    this.chatService.getOnlineUsers(user)
      .subscribe((response: any) => {

        console.log(response);

        if (response.status) {
          this.status = 'Online';
        } else {
          this.status = 'Offline';
        }

      });
  }
}