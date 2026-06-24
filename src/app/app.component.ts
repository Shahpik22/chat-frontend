import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Component,
  ElementRef,
  NgZone,
  ViewChild
} from '@angular/core';

import { ChatService } from './chat.service';
import { SocketService } from './socket.service';
import { ChangeDetectorRef } from '@angular/core';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  @ViewChild('scrollMe')
  private scrollContainer!: ElementRef;

  // login
  name = '';
  joined = false;

  // room
  roomId = '';
  roomCreated = false;

  // message
  message = '';
  messages: any[] = [];

  // status
  status = 'Offline';

  // image
  selectedImage = '';
  previewImage = '';

  // dialog
  showImageDialog = false;
  selectedDialogImage = '';
  selectedDialogMsg: any = null;

  // notification
  showInAppNotif = false;
  notifText = '';

  // tab blinking
  originalTitle = document.title;
  blinkInterval: any;
  blinkToggle = false;
  unreadCount = 0;

  constructor(
    private chatService: ChatService,
    public socketService: SocketService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) { }

  /* =========================
     INIT
  ========================= */

  ngOnInit() {

    const savedName =
      localStorage.getItem('chat_name');

    const savedRoom =
      localStorage.getItem('chat_roomId');

    if (savedName) {

      this.name = savedName;
      this.joined = true;
    }

    if (savedRoom) {

      this.roomId = savedRoom;
      this.roomCreated = true;

      this.loadMessages();

      this.joinSocketRoom();
    }

    window.addEventListener('focus', () => {

      this.stopTabBlink();

      this.socketService.heartbeat(this.name);
    });
  }

  /* =========================
     LOGIN
  ========================= */

  joinChat() {

    if (!this.name.trim()) return;

    this.joined = true;

    localStorage.setItem(
      'chat_name',
      this.name
    );

    Notification
      .requestPermission()
      .then(permission => {

        console.log(permission);
      });

    this.startHeartbeat();
  }

  /* =========================
     CREATE ROOM
  ========================= */

  createRoom() {

    this.messages = [];

    if (!this.name.trim()) return;

    const randomId =
      Math.floor(1000 + Math.random() * 9000);

    this.roomId = randomId.toString();

    localStorage.setItem(
      'chat_roomId',
      this.roomId
    );

    this.roomCreated = true;

    this.loadMessages();

    this.joinSocketRoom();
  }

  /* =========================
     JOIN ROOM
  ========================= */

  joinRoom() {

    this.messages = [];

    if (!this.name.trim()) return;

    if (!/^\d{4}$/.test(this.roomId)) {

      alert('Room ID must be exactly 4 digits');

      return;
    }

    localStorage.setItem(
      'chat_roomId',
      this.roomId
    );

    this.roomCreated = true;

    this.loadMessages();

    this.joinSocketRoom();
  }

  /* =========================
     SOCKET ROOM
  ========================= */

  joinSocketRoom() {

    this.socketService.joinRoom(this.roomId);

    /* =========================
       NEW MESSAGE
    ========================= */

    // this.socketService.onMessage((msg: any) => {

    //   const existing =
    //     this.messages.find(
    //       m =>
    //         m._id === msg._id ||
    //         (
    //           m.tempId &&
    //           m.tempId === msg.tempId
    //         )
    //     );

    //   if (existing) return;

    //   this.messages = [
    //     ...this.messages,
    //     msg
    //   ].sort((a, b) =>
    //     new Date(a.createdAt).getTime() -
    //     new Date(b.createdAt).getTime()
    //   );

    //   // notification
    //   if (msg.name !== this.name) {

    //     this.startTabBlink();

    //     this.showNotification(msg);

    //     this.notifyInTab(msg);
    //   }

    //   setTimeout(() => {

    //     this.scrollToBottom();

    //   }, 50);
    // });

    // this.socketService.onMessage((msg: any) => {

    //   /* =========================
    //      FIND TEMP MESSAGE
    //   ========================= */

    //   const tempIndex =
    //     this.messages.findIndex(
    //       m =>
    //         m.tempId &&
    //         m.tempId === msg.tempId
    //     );

    //   /* =========================
    //      REPLACE TEMP MESSAGE
    //   ========================= */

    //   if (tempIndex !== -1) {

    //     this.messages[tempIndex] = {

    //       ...msg
    //     };

    //     return;
    //   }

    //   /* =========================
    //      PREVENT DUPLICATE
    //   ========================= */

    //   const existing =
    //     this.messages.find(
    //       m => m._id === msg._id
    //     );

    //   if (existing) return;

    //   /* =========================
    //      ADD NEW MESSAGE
    //   ========================= */

    //   this.messages = [
    //     ...this.messages,
    //     msg
    //   ].sort((a, b) =>
    //     new Date(a.createdAt).getTime() -
    //     new Date(b.createdAt).getTime()
    //   );

    //   /* =========================
    //      NOTIFICATION
    //   ========================= */

    //   if (msg.name !== this.name) {

    //     this.startTabBlink();

    //     this.showNotification(msg);

    //     this.notifyInTab(msg);
    //   }

    //   setTimeout(() => {

    //     this.scrollToBottom();

    //   }, 50);
    // });

    this.socketService.onMessage((msg: any) => {

      const tempIndex =
        this.messages.findIndex(
          m =>
            m.tempId &&
            m.tempId === msg.tempId
        );

      if (tempIndex !== -1) {

        this.messages[tempIndex] = {
          ...msg
        };

        return;
      }

      const existing =
        this.messages.find(
          m => m._id === msg._id
        );

      if (existing) return;

      this.messages = [
        ...this.messages,
        msg
      ];

      // 🔥 SEND READ RECEIPT LIVE
      if (msg.name !== this.name) {

        this.socketService.readMessage(
          this.roomId,
          this.name
        );
      }

      setTimeout(() => {
        this.scrollToBottom();
      }, 50);
    });

    /* =========================
       READ RECEIPT
    ========================= */

    // this.socketService.socket.on(
    //   'messages-read',
    //   () => {

    //     this.messages.forEach(msg => {
    //       console.log("message " + msg.name);

    //       if (msg.name !== this.name) {

    //         msg.read = true;
    //       }
    //     });
    //     console.log("this.message : " + JSON.stringify(this.messages));
    //   }
    // );

    // this.socketService.socket.on(
    //   'messages-read',
    //   () => {

    //     this.ngZone.run(() => {
    //       this.messages = this.messages.map(msg => {

    //         if (msg.name === this.name) {

    //           return {
    //             ...msg,
    //             read: true
    //           };
    //         }

    //         return msg;
    //       });
    //     });
    //     // this.cdr.detectChanges(); // 🔥 FORCE UI UPDATE
    //     console.log("this.messages  " + this.messages);
    //   }
    // );

    this.socketService.socket.on(
      'messages-read',
      () => {

        this.ngZone.run(() => {

          this.messages = this.messages.map(msg => {

            if (msg.name === this.name) {

              return {
                ...msg,
                read: true
              };
            }

            return msg;
          });

        });

      }
    );

    /* =========================
       VIEW ONCE UPDATE
    ========================= */

    this.socketService.socket.on(
      'view-once-updated',
      (data: any) => {

        const msg =
          this.messages.find(
            m => m._id === data.messageId
          );

        if (msg) {

          msg.image = null;

          msg.expired = true;
        }
      }
    );

    /* =========================
       ONLINE STATUS
    ========================= */

    this.socketService.socket.on(
      'user-online',
      (data: any) => {

        if (data.name !== this.name) {

          this.status =
            data.status
              ? 'Online'
              : 'Offline';
        }
      }
    );
  }

  /* =========================
     LOAD OLD MESSAGES
  ========================= */

  loadMessages() {

    if (!this.roomId) return;

    this.chatService
      .getMessages(this.roomId)
      .subscribe((data: any[]) => {

        this.messages = data;

        setTimeout(() => {
          this.cdr.detectChanges();

          this.scrollToBottom();

        }, 50);
      });

    this.socketService.readMessage(
      this.roomId,
      this.name
    );
  }

  /* =========================
     SEND MESSAGE
  ========================= */

  sendMessage() {

    if (
      !this.message.trim() &&
      !this.selectedImage
    ) return;

    const tempId =
      'tmp_' + Date.now();

    const data = {

      tempId,

      roomId: this.roomId,

      name: this.name,

      message: this.message,

      image: this.selectedImage,

      viewOnce:
        this.selectedImage
          ? true
          : false,

      viewedBy: [],

      read: false,

      createdAt: new Date()
    };

    // instant UI

    this.messages.push(data);

    this.cdr.detectChanges();

    this.scrollToBottom();

    // socket send

    this.socketService.sendMessage(data);

    // clear input

    this.message = '';

    this.selectedImage = '';

    this.previewImage = '';
    // this.scrollToBottom();
  }

  /* =========================
     IMAGE SELECT
  ========================= */

  onImageSelected(event: any) {

    const file =
      event.target.files[0];

    if (!file) return;

    const reader =
      new FileReader();

    reader.onload = (e: any) => {

      const img = new Image();

      img.src = e.target.result;

      img.onload = () => {

        const canvas =
          document.createElement('canvas');

        const MAX_WIDTH = 600;

        const scale =
          MAX_WIDTH / img.width;

        canvas.width = MAX_WIDTH;

        canvas.height =
          img.height * scale;

        const ctx =
          canvas.getContext('2d');

        if (!ctx) return;

        ctx.drawImage(
          img,
          0,
          0,
          canvas.width,
          canvas.height
        );

        const compressed =
          canvas.toDataURL(
            'image/jpeg',
            0.5
          );

        this.selectedImage = compressed;

        this.previewImage = compressed;
      };
    };

    reader.readAsDataURL(file);
  }

  /* =========================
     REMOVE IMAGE
  ========================= */

  removeSelectedImage() {

    this.selectedImage = '';

    this.previewImage = '';
  }

  /* =========================
     VIEW ONCE
  ========================= */

  openViewOnce(msg: any) {

    if (
      msg.viewedBy?.includes(this.name)
    ) return;

    this.selectedDialogImage =
      msg.image;

    this.selectedDialogMsg =
      msg;

    this.showImageDialog = true;

    this.socketService.viewOnce(
      msg._id,
      this.name
    );
  }

  closeDialog() {

    this.showImageDialog = false;

    this.selectedDialogImage = '';

    this.selectedDialogMsg = null;
  }

  /* =========================
     HEARTBEAT
  ========================= */

  startHeartbeat() {

    setInterval(() => {

      this.socketService
        .heartbeat(this.name);

    }, 5000);
  }

  /* =========================
     SCROLL
  ========================= */

  scrollToBottom(): void {

    try {

      this.scrollContainer
        .nativeElement
        .scrollTo({

          top:
            this.scrollContainer
              .nativeElement
              .scrollHeight,

          behavior: 'smooth'
        });

    } catch (err) { }
  }

  /* =========================
     NOTIFICATION
  ========================= */

  showNotification(msg: any) {

    if (
      Notification.permission
      !== 'granted'
    ) return;

    if (msg.name === this.name)
      return;

    new Notification(
      `💬 ${msg.name}`,
      {
        body:
          msg.message ||
          'Sent an image',

        icon:
          'assets/chat-icon.png'
      }
    );
  }

  notifyInTab(msg: any) {

    if (msg.name === this.name)
      return;

    this.notifText =
      `${msg.name}: ${msg.message || 'Sent an image'}`;

    this.showInAppNotif = true;

    setTimeout(() => {

      this.showInAppNotif = false;

    }, 3000);
  }

  /* =========================
     TAB BLINK
  ========================= */

  startTabBlink() {

    if (this.blinkInterval)
      return;

    this.blinkInterval =
      setInterval(() => {

        if (!document.hidden)
          return;

        this.blinkToggle =
          !this.blinkToggle;

        document.title =
          this.blinkToggle
            ? '🔴 New Message'
            : '💬 Chat App';

      }, 1000);
  }

  stopTabBlink() {

    clearInterval(
      this.blinkInterval
    );

    this.blinkInterval = null;

    this.unreadCount = 0;

    document.title =
      this.originalTitle;
  }

  /* =========================
     ROOM INPUT
  ========================= */

  onRoomIdInput() {

    this.roomId =
      this.roomId.replace(
        /[^0-9]/g,
        ''
      );
  }

  /* =========================
     CHECK BOTTOM
  ========================= */

  isNearBottom(): boolean {

    try {

      const el =
        this.scrollContainer
          .nativeElement;

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

  /* =========================
     LOGOUT
  ========================= */

  logout() {

    localStorage.removeItem(
      'chat_name'
    );

    localStorage.removeItem(
      'chat_roomId'
    );

    this.name = '';

    this.roomId = '';

    this.joined = false;

    this.roomCreated = false;

    this.messages = [];
  }

  /* =========================
     BACK
  ========================= */

  back() {

    this.roomCreated = false;

    this.roomId = '';

    this.messages = [];
  }

  /* =========================
     TRACK BY
  ========================= */

  trackByMessage(
    index: number,
    msg: any
  ): string {

    return (
      msg._id ||
      msg.tempId
    );
  }
}