
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
  selectedImage: string = '';
  previewImage: string = '';
  isViewOnce = false;

  showImageDialog = false;
  selectedDialogImage: string = '';
  selectedDialogMsg: any = null;

  showInAppNotif = false;
  notifText = '';

  originalTitle = document.title;
  blinkInterval: any;
  blinkToggle = false;
  unreadCount = 0;
  constructor(private chatService: ChatService) { }

  // ---------------- LOGIN ----------------
  // joinChat() {
  //   if (!this.name.trim()) return;

  //   this.joined = true;
  //   // SAVE USER
  //   localStorage.setItem('chat_name', this.name);

  //   if (this.name == 'Syah') {
  //     this.isDisabled = false;
  //   }

  //   // this.startHeartbeat();
  //   this.loadOnlineUsers(this.name);

  //   setInterval(() => {
  //     this.loadMessages();
  //     this.loadOnlineUsers(this.name);
  //   }, 3000);
  // }
  joinChat() {

    if (!this.name.trim()) return;

    this.joined = true;

    localStorage.setItem('chat_name', this.name);

    // 🔔 request browser notification permission
    // if ('Notification' in window) {

    //   Notification.requestPermission().then(permission => {
    //     console.log('Notification permission:', permission);
    //   });

    // }
    // 🔔 MUST run on user action (click)
    Notification.requestPermission().then(p => {
      console.log('Permission:', p);
    });

    setInterval(() => {
      this.loadMessages();
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

    this.chatService
      .markAsRead(this.roomId, this.name)
      .subscribe();

    this.chatService
      .getMessages(this.roomId)
      .subscribe((data: any[]) => {

        let hasNewMessage = false;

        data.forEach((msg: any) => {

          const existing = this.messages.find(
            m => m._id === msg._id
          );

          // NEW MESSAGE
          if (!existing) {

            this.messages.push(msg);

            hasNewMessage = true;

            // 🔔 trigger notification
            // this.showNotification(msg);

            // // 🔔 in-tab notification
            // this.notifyInTab(msg);

            // 🔥 increase unread counter
            // if (msg.name !== this.name) {
            //   this.unreadCount++;
            // }

            // start blinking
            this.startTabBlink();

          } else {
            existing.image = msg.image;
            // ONLY update if something changed
            if (
              existing.status !== msg.status ||
              existing.read !== msg.read
            ) {

              existing.status = msg.status;
              existing.read = msg.read;
            }
          }
        });

        // SORT
        this.messages.sort((a, b) =>
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime()
        );

        // SCROLL ONLY FOR NEW MESSAGE
        if (hasNewMessage) {

          setTimeout(() => {

            this.scrollToBottom();

          }, 50);
        }

      });
  }

  // ---------------- SEND MESSAGE ----------------
  // sendMessage() {

  //   if (!this.message.trim()) return;

  //   const data = {
  //     roomId: this.roomId,
  //     name: this.name,
  //     message: this.message,
  //     read: false
  //   };

  //   this.chatService.sendMessage(data)
  //     .subscribe(() => {
  //       this.message = '';
  //       this.loadMessages();
  //       this.scrollToBottom();
  //     });
  // }

  sendMessage() {

    if (
      !this.message.trim() &&
      !this.selectedImage
    ) return;

    const data = {
      roomId: this.roomId,
      name: this.name,
      message: this.message,
      image: this.selectedImage,
      // IMAGE ALWAYS VIEW ONCE
      viewOnce:
        this.selectedImage ? true : false,

      viewedBy: [],
      read: false
    };

    this.chatService.sendMessage(data)
      .subscribe(() => {

        this.message = '';

        this.selectedImage = '';
        this.previewImage = '';
        this.loadMessages();
        this.scrollToBottom();
      });
  }

  // onImageSelected(event: any) {

  //   const file = event.target.files[0];

  //   if (!file) return;

  //   // only image
  //   if (!file.type.startsWith('image/')) {
  //     alert('Please select image only');
  //     return;
  //   }

  //   const reader = new FileReader();

  //   reader.onload = () => {

  //     this.selectedImage = reader.result as string;

  //     this.previewImage = this.selectedImage;
  //   };

  //   reader.readAsDataURL(file);
  // }

  
onImageSelected(event: any) {

  const file = event.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = (e: any) => {

    const img = new Image();

    img.src = e.target.result;

    img.onload = () => {

      // create canvas
      const canvas = document.createElement('canvas');

      // resize
      const MAX_WIDTH = 600;
      const scale =
        MAX_WIDTH / img.width;

      canvas.width = MAX_WIDTH;
      canvas.height =
        img.height * scale;

      const ctx =
        canvas.getContext('2d');

      if (!ctx) return;

      // draw resized image
      ctx.drawImage(
        img,
        0,
        0,
        canvas.width,
        canvas.height
      );

      // compress image
      const compressed =
        canvas.toDataURL(
          'image/jpeg',
          0.5 // quality 0-1
        );

      // save
      this.selectedImage = compressed;
      this.previewImage = compressed;

      console.log(
        'Compressed size:',
        compressed.length
      );
    };
  };

  reader.readAsDataURL(file);
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

    window.addEventListener('focus', () => {
      this.stopTabBlink();
      //Update last online
      this.chatService.heartbeat(this.name);
    });
  }
  logout() {
    localStorage.removeItem('chat_name');
    localStorage.removeItem('chat_roomId');

    this.name = '';
    this.roomId = '';
    this.joined = false;
    this.roomCreated = false;
    this.messages.length = 0;
    this.messages = [];

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

  removeSelectedImage() {

    this.selectedImage = '';
    this.previewImage = '';
  }

  // openViewOnce(msg: any) {

  //   console.log('CLICKED IMAGE', msg);

  //   if (!msg?.image) {
  //     console.log('NO IMAGE FOUND');
  //     return;
  //   }

  //   if (msg.viewedBy?.includes(this.name)) {
  //     console.log('ALREADY VIEWED');
  //     return;
  //   }

  //   // OPEN IMAGE FIRST (IMPORTANT)
  //   const win = window.open();

  //   if (win) {
  //     win.document.write(`
  //     <img src="${msg.image}" style="width:100%" />
  //   `);
  //   } else {
  //     alert('Popup blocked');
  //   }

  //   // THEN MARK VIEWED
  //   this.chatService
  //     .markViewOnce(msg._id, this.name)
  //     .subscribe(() => {

  //       if (!msg.viewedBy) msg.viewedBy = [];

  //       msg.viewedBy.push(this.name);

  //       console.log('MARKED AS VIEWED');
  //     });
  // }
  openViewOnce(msg: any) {

    if (msg.viewedBy?.includes(this.name)) return;

    this.selectedDialogImage = msg.image;
    this.selectedDialogMsg = msg;
    this.showImageDialog = true;

    // mark as viewed
    this.chatService
      .markViewOnce(msg._id, this.name)
      .subscribe(() => {

        if (!msg.viewedBy) msg.viewedBy = [];
        msg.viewedBy.push(this.name);
      });
  }
  closeDialog() {
    this.showImageDialog = false;
    this.selectedDialogImage = '';
    this.selectedDialogMsg = null;
  }

  showNotification(msg: any) {

    if (Notification.permission !== 'granted') return;

    // don't notify own messages
    if (msg.name === this.name) return;

    new Notification(`💬 ${msg.name}`, {

      body: msg.message || 'Sent an image',

      icon: 'assets/chat-icon.png' // optional
    });
  }

  notifyInTab(msg: any) {

    if (msg.name === this.name) return;

    this.notifText =
      `${msg.name}: ${msg.message || 'Sent an image'}`;

    this.showInAppNotif = true;

    // auto hide after 3s
    setTimeout(() => {
      this.showInAppNotif = false;
    }, 3000);
  }

  startTabBlink() {

    // prevent multiple intervals
    if (this.blinkInterval) return;

    this.blinkInterval = setInterval(() => {

      if (!document.hidden) return;

      this.blinkToggle = !this.blinkToggle;

      document.title = this.blinkToggle
        // ? `🔴 New Message (${this.unreadCount})`
        // : `💬 Chat App (${this.unreadCount})`;
        ? `🔴 New Message`
        : `💬 Chat App`;

    }, 1000);
  }

  stopTabBlink() {

    clearInterval(this.blinkInterval);
    this.blinkInterval = null;

    this.unreadCount = 0;
    document.title = this.originalTitle;
  }
}