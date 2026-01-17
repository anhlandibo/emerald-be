# System Notifications - Hướng dẫn sử dụng

## 📌 Tổng quan

Module **System Notifications** là hệ thống thông báo real-time hoàn toàn độc lập, được thiết kế để gửi thông báo hệ thống qua Socket.IO và lưu vào database.

### Sự khác biệt với Notifications module

| Feature      | Notifications                       | System Notifications         |
| ------------ | ----------------------------------- | ---------------------------- |
| **Mục đích** | Thông báo chính thức cho cư dân     | Thông báo real-time hệ thống |
| **Scope**    | Block, Floor, All                   | User cụ thể hoặc broadcast   |
| **Channels** | SOCKET, EMAIL, SMS                  | Chỉ SOCKET                   |
| **Target**   | Theo block/floor/resident           | Theo userId                  |
| **Use case** | Bảo trì, chính sách, cảnh báo chung | Đơn hàng, booking, updates   |
| **Database** | `notifications` table               | `system_notifications` table |

---

## 🚀 Cách sử dụng

### Bước 1: Import module vào module của bạn

```typescript
// invoices.module.ts (hoặc bất kỳ module nào)
import { Module } from '@nestjs/common';
import { SystemNotificationsModule } from '../system-notifications/system-notifications.module';

@Module({
  imports: [
    SystemNotificationsModule, // ← Import module
  ],
  // ...
})
export class InvoicesModule {}
```

### Bước 2: Inject service và sử dụng

```typescript
// invoices.service.ts
import { Injectable } from '@nestjs/common';
import { SystemNotificationsService } from '../system-notifications/system-notifications.service';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly systemNotificationsService: SystemNotificationsService,
  ) {}

  async createInvoice(data: any, userId: number) {
    // Logic tạo hóa đơn...
    const invoice = await this.save(data);

    // Gửi thông báo real-time
    await this.systemNotificationsService.sendSystemNotification({
      title: 'Hóa đơn mới',
      content: `Bạn có hóa đơn #${invoice.id} cần thanh toán`,
      type: 'WARNING',
      targetUserIds: [userId],
      metadata: {
        invoiceId: invoice.id,
        amount: invoice.amount,
      },
    });

    return invoice;
  }
}
```

---

## 📖 Ví dụ sử dụng

### 1. Gửi cho TẤT CẢ người dùng (Broadcast)

```typescript
// Bảo trì hệ thống
await this.systemNotificationsService.sendSystemNotification({
  title: 'Bảo trì hệ thống',
  content: 'Hệ thống sẽ bảo trì từ 2h-4h sáng ngày mai',
  type: 'SYSTEM',
  // Không truyền targetUserIds = broadcast to all
});
```

### 2. Gửi cho 1 người dùng

```typescript
// Đơn hàng được tạo
await this.systemNotificationsService.sendSystemNotification({
  title: 'Đơn hàng thành công',
  content: 'Đơn hàng #12345 đã được tạo',
  type: 'SUCCESS',
  targetUserIds: [userId],
  metadata: {
    orderId: 12345,
    status: 'PENDING',
  },
});
```

### 3. Gửi cho nhiều người dùng

```typescript
// Assign task cho technicians
await this.systemNotificationsService.sendSystemNotification({
  title: 'Công việc mới',
  content: 'Bạn được giao nhiệm vụ bảo trì #456',
  type: 'INFO',
  targetUserIds: [101, 102, 103], // 3 technicians
  metadata: {
    ticketId: 456,
    priority: 'HIGH',
    location: 'Tòa A - Tầng 5',
  },
});
```

### 4. Thông báo lỗi

```typescript
// Payment failed
await this.systemNotificationsService.sendSystemNotification({
  title: 'Thanh toán thất bại',
  content: 'Giao dịch #789 không thành công. Vui lòng thử lại.',
  type: 'ERROR',
  targetUserIds: [userId],
  metadata: {
    transactionId: 789,
    reason: 'INSUFFICIENT_FUNDS',
  },
});
```

### 5. Metadata phức tạp

```typescript
await this.systemNotificationsService.sendSystemNotification({
  title: 'Booking confirmed',
  content: 'Đặt lịch dịch vụ thành công',
  type: 'SUCCESS',
  targetUserIds: [userId],
  metadata: {
    bookingId: 999,
    service: {
      name: 'Dọn dẹp',
      price: 500000,
      duration: 120, // minutes
    },
    schedule: {
      date: '2026-01-20',
      time: '09:00',
    },
    technician: {
      id: 55,
      name: 'Nguyễn Văn A',
    },
  },
});
```

---

## 🎨 Notification Types

```typescript
enum SystemNotificationType {
  INFO = 'INFO', // Màu xanh - Thông tin chung
  SUCCESS = 'SUCCESS', // Màu xanh lá - Thành công
  WARNING = 'WARNING', // Màu vàng - Cảnh báo
  ERROR = 'ERROR', // Màu đỏ - Lỗi
  SYSTEM = 'SYSTEM', // Màu tím - Hệ thống
}
```

---

## 🖥️ Frontend Implementation

### Socket Connection

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001/ws', {
  auth: {
    token: localStorage.getItem('access_token'),
  },
});

// Lắng nghe thông báo
socket.on('system_notification', (notification) => {
  console.log('📬 New notification:', notification);

  // Structure:
  // {
  //   id: 123,
  //   title: 'Hóa đơn mới',
  //   content: 'Bạn có hóa đơn #456 cần thanh toán',
  //   type: 'WARNING',
  //   metadata: { invoiceId: 456, amount: 500000 },
  //   createdAt: '2026-01-17T10:30:00Z',
  //   timestamp: '2026-01-17T10:30:00Z'
  // }

  showNotification(notification);
});
```

### React Example

```tsx
import { useEffect } from 'react';
import { toast } from 'react-toastify';

useEffect(() => {
  socket.on('system_notification', (notification) => {
    // Show toast based on type
    switch (notification.type) {
      case 'SUCCESS':
        toast.success(notification.content);
        break;
      case 'ERROR':
        toast.error(notification.content);
        break;
      case 'WARNING':
        toast.warning(notification.content);
        break;
      default:
        toast.info(notification.content);
    }

    // Update notification list
    setNotifications((prev) => [notification, ...prev]);
  });

  return () => {
    socket.off('system_notification');
  };
}, []);
```

---

## 🔌 API Endpoints

### POST `/system-notifications/send`

Gửi thông báo hệ thống

**Body:**

```json
{
  "title": "Tiêu đề",
  "content": "Nội dung thông báo",
  "type": "INFO",
  "targetUserIds": [1, 2, 3],
  "metadata": { "key": "value" }
}
```

### GET `/system-notifications`

Lấy danh sách thông báo (có phân trang)

**Query params:** `?page=1&limit=20&type=INFO`

### GET `/system-notifications/stats`

Thống kê thông báo

### GET `/system-notifications/:id`

Chi tiết thông báo

### DELETE `/system-notifications/:id`

Xóa thông báo

---

## ✅ Response Format

```typescript
{
  success: true,
  notification: {
    id: 123,
    title: "Hóa đơn mới",
    content: "Bạn có hóa đơn #456 cần thanh toán",
    type: "WARNING",
    targetUserIds: [10],
    metadata: { invoiceId: 456 },
    isSent: true,
    sentAt: "2026-01-17T10:30:00Z",
    createdAt: "2026-01-17T10:30:00Z",
    updatedAt: "2026-01-17T10:30:00Z"
  },
  message: "Gửi thông báo hệ thống thành công"
}
```

---

## 💡 Best Practices

1. **Sử dụng type phù hợp** cho từng loại thông báo
2. **Metadata nên chứa thông tin hữu ích** để frontend xử lý
3. **Title ngắn gọn**, content chi tiết hơn
4. **Không gửi quá nhiều thông báo** cùng lúc
5. **targetUserIds = null/undefined** = broadcast to all

---

## 🐛 Troubleshooting

### Không nhận được thông báo?

✅ Kiểm tra:

- User đã kết nối WebSocket chưa?
- Token JWT có hợp lệ không?
- userId có đúng không?
- SocketsModule đã được import vào AppModule?

### Database error?

✅ Chạy migration để tạo bảng `system_notifications`:

```bash
npm run migration:generate
npm run migration:run
```

---

## 📦 Module Structure

```
system-notifications/
├── dto/
│   ├── send-system-notification.dto.ts
│   └── query-system-notification.dto.ts
├── entities/
│   └── system-notification.entity.ts
├── system-notifications.controller.ts
├── system-notifications.service.ts
└── system-notifications.module.ts
```
