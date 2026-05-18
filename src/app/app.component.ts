
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from './chat.service';
import {
  Component,
  ElementRef,
  ViewChild
} from '@angular/core';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  @ViewChild('scrollMe') private scrollContainer!: ElementRef;
  // login user
  name = '';
  joined = false;

  // chat target user
  // chatUser = 'Syah';

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
  roomCreated = false;
  constructor(private chatService: ChatService) { }

  // ---------------- LOGIN ----------------
  joinChat() {
    if (!this.name.trim()) return;

    this.joined = true;
    // SAVE USER
    localStorage.setItem('chat_name', this.name);

    if (this.name == 'Syah') {
      this.isDisabled = false;
    }

    // this.startHeartbeat();
    this.loadOnlineUsers(this.name);

    setInterval(() => {
      this.loadMessages();
      this.loadOnlineUsers(this.name);
    }, 3000);
  }

  // ---------------- CREATE ROOM ----------------
  createRoom() {

    if (!this.name.trim()) return;

    // random 4 digit number
    const randomId = Math.floor(1000 + Math.random() * 9000);

    // room id example: A_Syah_4821
    this.roomId = randomId + '';

    // SAVE ROOM
    localStorage.setItem('chat_roomId', this.roomId);

    this.roomCreated = true;

    this.loadMessages();

    // polling
    this.interval = setInterval(() => {
      this.loadMessages();
    }, 1500);
  }

  // ---------------- JOIN ROOM ----------------
  joinRoom() {

    if (!this.name.trim()) return;

    if (!/^\d{4}$/.test(this.roomId)) {
      alert('Room ID must be exactly 4 digits');
      return;
    }

    this.roomId = this.roomId

    this.roomCreated = true;

    // SAVE ROOM
    localStorage.setItem('chat_roomId', this.roomId);

    this.loadMessages();

    // polling
    this.interval = setInterval(() => {
      this.loadMessages();
    }, 1500);
  }
  // ---------------- LOAD MESSAGES ----------------
  // loadMessages() {

  //   if (!this.roomId) return;

  //   this.chatService
  //     .markAsRead(this.roomId, this.name)
  //     .subscribe();

  //   this.chatService.getMessages(this.roomId)
  //     .subscribe((data: any[]) => {

  //       data.forEach((msg: any) => {

  //         const exists = this.messages.some(
  //           m => m._id === msg._id
  //         );

  //         if (!exists) {
  //           this.messages.push(msg);
  //         }
  //       });

  //       if (data.length > 0) {

  //         this.lastMessageTime =
  //           data[data.length - 1].createdAt;

  //         // setTimeout(() => {
  //         // this.scrollToBottom();
  //         // }, 100);
  //       }
  //     });
  // }

  loadMessages() {

    if (!this.roomId) return;

    // mark as read
    this.chatService
      .markAsRead(this.roomId, this.name)
      .subscribe();

    this.chatService
      .getMessages(this.roomId)
      .subscribe((data: any[]) => {

        let hasNewMessage = false;

        data.forEach((msg: any) => {

          const index = this.messages.findIndex(
            m => m._id === msg._id
          );

          // update existing message
          if (index !== -1) {

            this.messages[index] = msg;

          } else {

            // add new message
            this.messages.push(msg);

            hasNewMessage = true;
          }
        });

        // sort by timestamp
        this.messages.sort((a, b) =>
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime()
        );

        // scroll ONLY when new message arrives
        if (hasNewMessage) {

          setTimeout(() => {

            if (this.isNearBottom()) {

              this.scrollToBottom();
            }

          }, 50);
        }

      });
  }

  // ---------------- SEND MESSAGE ----------------
  sendMessage() {

    if (!this.message.trim()) return;

    const data = {
      roomId: this.roomId,
      name: this.name,
      message: this.message,
      read: false
    };

    this.chatService.sendMessage(data)
      .subscribe(() => {
        this.message = '';
        this.loadMessages();
        this.scrollToBottom();
      });
  }

  // ---------------- SCROLL ----------------
  // scrollToBottom() {
  //   try {
  //     const el = document.querySelector('.messages');
  //     if (el) {
  //       el.scrollTop = el.scrollHeight;
  //     }
  //   } catch { }
  // }

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


  ngOnInit() {

    const savedName = localStorage.getItem('chat_name');
    const savedRoom = localStorage.getItem('chat_roomId');

    if (savedName) {
      this.name = savedName;
      this.joined = true;
    }

    if (savedRoom) {
      this.roomId = savedRoom;
      this.roomCreated = true;

      this.loadMessages();

      this.interval = setInterval(() => {
        this.loadMessages();
      }, 1500);
    }
  }
  logout() {
    localStorage.removeItem('chat_name');
    localStorage.removeItem('chat_roomId');

    this.name = '';
    this.roomId = '';
    this.joined = false;
    this.roomCreated = false;

    clearInterval(this.interval);
  }

  onRoomIdInput() {
    this.roomId = this.roomId.replace(/[^0-9]/g, '');
  }

  // ---------------- AUTO SCROLL ----------------
  scrollToBottom(): void {

    try {

      this.scrollContainer.nativeElement.scrollTo({

        top:
          this.scrollContainer.nativeElement.scrollHeight,

        behavior: 'smooth'
      });

    } catch (err) { }
  }

  // ---------------- CHECK IF USER NEAR BOTTOM ----------------
  isNearBottom(): boolean {

    try {

      const el = this.scrollContainer.nativeElement;

      return (
        el.scrollHeight -
        el.scrollTop -
        el.clientHeight
        < 150
      );

    } catch {

      return true;
    }
  }
}