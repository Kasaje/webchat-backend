// webchat-backend/index.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors()); // อนุญาตการร้องขอ HTTP ทั่วไป (เช่น การยิงทดสอบ API)

const server = http.createServer(app);

// ตั้งค่า Socket.io และเปิดประตู CORS ต้อนรับหน้าบ้าน Next.js
const io = new Server(server, {
  cors: {
    // ใส่ลิงก์ localhost สำหรับรันเทสต์บนเครื่อง และเตรียมใส่ลิงก์ Vercel ตอนจะปล่อยของจริง
    origin: [process.env.FRONTEND_URI],
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`[Connected] ยูสเซอร์เชื่อมต่อเข้ามาใหม่: ${socket.id}`);

  // ตัวแปรภายในเพื่อจดจำว่า Socket นี้ล็อกอินเข้าห้องไหนอยู่ ณ ปัจจุบัน
  let currentRoomId = null;

  // 1. ดักฟังเมื่อผู้ใช้พยายามขอเข้าร่วมห้องแชตลับ 1:1
  socket.on("join_private_room", (roomId) => {
    const room = io.sockets.adapter.rooms.get(roomId);
    const numClients = room ? room.size : 0; // นับจำนวนคนในห้องปัจจุบัน

    if (numClients < 2) {
      // ผ่านเงื่อนไข: สั่งให้ย้ายตัวเข้าห้องลับ
      socket.join(roomId);
      currentRoomId = roomId; // บันทึกสถานะห้องปัจจุบันของยูสเซอร์นี้ไว้

      // ส่งสัญญาณบอกตัวผู้ใช้เองว่า "คุณเข้าห้องสำเร็จแล้ว"
      socket.emit("join_success", { roomId });
      console.log(
        `[Room ${roomId}] ยูสเซอร์ ${socket.id} เข้าห้องสำเร็จ (สมาชิกปัจจุบัน: ${numClients + 1}/2)`,
      );

      // 📢 ระบบส่งการแจ้งเตือน (System Notice) แยกตามสถานการณ์
      if (numClients === 0) {
        // กรณีเป็นคนแรกที่สร้างห้อง -> ส่งข้อความบอกให้เขารอคู่หู
        socket.emit(
          "system_notice",
          "You joined the room. Waiting for a peer...",
        );
      } else if (numClients === 1) {
        // กรณีเป็นคนที่สองที่เข้าห้อง -> ส่งบอกตัวเองว่าพร้อมใช้งานแล้ว
        socket.emit("system_notice", "You connected. Chat is now active.");
        // และตะโกนบอกคนแรกที่รออยู่ก่อนหน้านี้ว่า "เพื่อนของคุณมาถึงแล้วนะ"
        socket.to(roomId).emit("system_notice", "A peer has joined the room.");
        socket.to(roomId).emit("partner_joined");
      }
    } else {
      // กรณีในห้องมีครบ 2 คนอยู่ก่อนหน้าแล้ว -> ปฏิเสธการเข้าห้องทันที
      socket.emit("room_full", {
        message: "This room is full. 1:1 private chat only.",
      });
      console.log(
        `[Denied] ยูสเซอร์ ${socket.id} โดนปฏิเสธเพราะห้อง ${roomId} เต็มความจุแล้ว`,
      );
    }
  });

  // 2. ระบบรับข้อความแชตสะท้อนส่งต่อ (ข้อความวิ่งบน RAM ไม่บันทึกลงดิสก์/ฐานข้อมูล)
  socket.on("send_private_message", ({ roomId, message }) => {
    // สั่งกระจายส่งต่อข้อความให้ทุกคนในห้องยกเว้นตัวคนส่งเอง
    socket.to(roomId).emit("receive_private_message", message);
  });

  // 3. ดักฟังเมื่อผู้ใช้ปิดแท็บ ปิดเบราว์เซอร์ หรืออินเทอร์เน็ตหลุด
  socket.on("disconnect", () => {
    console.log(`[Disconnected] ยูสเซอร์ตัดการเชื่อมต่อ: ${socket.id}`);

    // ถ้าเคยล็อกอินอยู่ในห้องใดห้องหนึ่งก่อนหลุดออกไป
    if (currentRoomId) {
      // ส่งสัญญาณข้อความระบบแจ้งคนที่ยังค้างอยู่ในห้องว่าเพื่อนหนีไปแล้ว
      socket.to(currentRoomId).emit("system_notice", "Peer has left the room.");
    }
  });
});

// ใช้พอร์ตที่แพลตฟอร์มคลาวด์ (Render) สุ่มจัดมาให้ผ่าน env หรือสลับใช้ 3001 ตอนรันบนเครื่องตัวเอง
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 [Backend Active] Server running on port ${PORT}`);
});
