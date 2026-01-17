# ✅ System Notifications Module - Đã hoàn thành

## 📂 Cấu trúc Module mới

```
emerald-be/src/modules/
├── system-notifications/           ← MODULE MỚI (độc lập)
│   ├── dto/
│   │   ├── send-system-notification.dto.ts
│   │   └── query-system-notification.dto.ts
│   ├── entities/
│   │   └── system-notification.entity.ts
│   ├── system-notifications.controller.ts
│   ├── system-notifications.service.ts
│   └── system-notifications.module.ts
│
├── notifications/                  ← MODULE CŨ (giữ nguyên)
│   └── ... (không thay đổi)
│
└── sockets/
    ├── socket.gateway.ts           ← Đã cập nhật
    └── sockets.module.ts            ← Đã cập nhật

emerald-be/src/migrations/
└── 1705484400000-CreateSystemNotificationsTable.ts  ← Migration mới
```

---

## 🎯 Sự khác biệt

### ❌ Trước đây (SAI)

- System notifications được thêm vào module Notifications hiện có
- Gây xung đột với notifications cho cư dân
- Không tách biệt rõ ràng

### ✅ Bây giờ (ĐÚNG)

- **2 module hoàn toàn độc lập:**
  1. **Notifications**: Thông báo chính thức cho cư dân (bảo trì, chính sách...)
  2. **System Notifications**: Thông báo real-time hệ thống (đơn hàng, booking...)

---

## 🚀 Cách sử dụng nhanh

### 1. Import module

```typescript
// any.module.ts
import { SystemNotificationsModule } from '../system-notifications/system-notifications.module';

@Module({
  imports: [SystemNotificationsModule],
})
```

### 2. Sử dụng trong service

```typescript
// any.service.ts
import { SystemNotificationsService } from '../system-notifications/system-notifications.service';

constructor(
  private readonly systemNotificationsService: SystemNotificationsService,
) {}

// Gửi thông báo
await this.systemNotificationsService.sendSystemNotification({
  title: 'Tiêu đề',
  content: 'Nội dung',
  type: 'INFO', // INFO | SUCCESS | WARNING | ERROR | SYSTEM
  targetUserIds: [1, 2, 3], // Hoặc bỏ qua để broadcast
  metadata: { key: 'value' },
});
```

---

## 📦 Database

### Bảng mới: `system_notifications`

```sql
CREATE TABLE system_notifications (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'INFO',
  target_user_ids TEXT,           -- NULL = broadcast
  metadata JSONB,                 -- Dữ liệu tùy chỉnh
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Chạy migration

```bash
npm run migration:run
```

---

## 📚 Tài liệu chi tiết

- **[SYSTEM_NOTIFICATIONS.md](./SYSTEM_NOTIFICATIONS.md)** - Hướng dẫn đầy đủ
- **[SYSTEM_NOTIFICATIONS_EXAMPLES.ts](./SYSTEM_NOTIFICATIONS_EXAMPLES.ts)** - Code examples

---

## 🔌 API Endpoints

| Method | Endpoint                      | Description         |
| ------ | ----------------------------- | ------------------- |
| POST   | `/system-notifications/send`  | Gửi thông báo       |
| GET    | `/system-notifications`       | Danh sách thông báo |
| GET    | `/system-notifications/stats` | Thống kê            |
| GET    | `/system-notifications/:id`   | Chi tiết            |
| DELETE | `/system-notifications/:id`   | Xóa                 |

---

## 🎨 Notification Types

```typescript
INFO; // Màu xanh - Thông tin
SUCCESS; // Màu xanh lá - Thành công
WARNING; // Màu vàng - Cảnh báo
ERROR; // Màu đỏ - Lỗi
SYSTEM; // Màu tím - Hệ thống
```

---

## ✨ Tính năng

✅ Real-time qua Socket.IO  
✅ Lưu database tự động  
✅ Broadcast hoặc gửi cho user cụ thể  
✅ Metadata tùy chỉnh  
✅ Hoàn toàn độc lập với Notifications  
✅ TypeScript support đầy đủ  
✅ API endpoints sẵn sàng

---

## 🔥 Quick Examples

```typescript
// 1. Broadcast to all
await this.systemNotificationsService.sendSystemNotification({
  title: 'Maintenance',
  content: 'System will be down at 2AM',
  type: 'SYSTEM',
});

// 2. Send to specific user
await this.systemNotificationsService.sendSystemNotification({
  title: 'Order Created',
  content: 'Your order #123 has been created',
  type: 'SUCCESS',
  targetUserIds: [userId],
  metadata: { orderId: 123 },
});
```

---

## 🎉 Module đã sẵn sàng sử dụng!

Bắt đầu gửi thông báo real-time ngay bây giờ 🚀
