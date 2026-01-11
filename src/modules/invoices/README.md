# Invoice Module APIs

## Tổng quan
Module Invoice quản lý hóa đơn thanh toán hàng tháng cho các căn hộ trong chung cư, bao gồm:
- Quản lý chỉ số điện nước (meter readings)
- Tính toán tự động theo bậc thang (tiered pricing)
- Tạo hóa đơn từ admin và client
- Xác minh chỉ số điện nước

## Entities

### 1. MeterReading
Lưu trữ chỉ số điện nước hàng tháng
- `id`: ID tự tăng
- `apartmentId`: ID căn hộ
- `feeTypeId`: ID loại phí (điện/nước)
- `readingDate`: Ngày chốt số
- `billingMonth`: Tháng tính tiền
- `oldIndex`: Chỉ số cũ
- `newIndex`: Chỉ số mới
- `usageAmount`: Số tiêu thụ (new - old)
- `imageProofUrl`: URL ảnh chụp đồng hồ
- `isVerified`: Trạng thái xác minh

### 2. Invoice
Hóa đơn tổng hợp hàng tháng
- `id`: ID tự tăng
- `invoiceCode`: Mã hóa đơn (VD: INV-202401-A101)
- `apartmentId`: ID căn hộ
- `period`: Kỳ thanh toán
- `totalAmount`: Tổng tiền
- `status`: Trạng thái (UNPAID/PAID/OVERDUE)
- Hỗ trợ soft delete

### 3. InvoiceDetail
Chi tiết từng dòng phí trong hóa đơn
- `id`: ID tự tăng
- `invoiceId`: ID hóa đơn
- `feeTypeId`: ID loại phí
- `amount`: Số lượng tiêu thụ
- `unitPrice`: Đơn giá (nếu không dùng bậc thang)
- `totalPrice`: Thành tiền
- `calculationBreakdown`: JSON lưu chi tiết tính bậc thang

## APIs

### 1. [ADMIN] Tạo hóa đơn
**POST** `/invoices/admin`

**Request Body:**
```json
{
  "waterIndex": 100,
  "electricityIndex": 200,
  "apartmentId": 1,
  "period": "2024-01-05T10:15:30Z"
}
```

**Mô tả:**
- Admin tạo hóa đơn cho căn hộ
- Tự động lấy chỉ số cũ từ meter_readings
- Tính toán theo bậc thang nếu có
- Tạo invoice_details với breakdown chi tiết
- Tự động thêm các phí cố định (quản lý, dịch vụ)
- Lưu meter readings với `isVerified = true`

**Logic tính toán:**
1. Lấy chỉ số cũ từ bảng meter_readings
2. Tính usage = newIndex - oldIndex
3. Áp dụng bậc thang (fee_tiers) nếu có
4. Thêm các phí FIXED_AREA (theo diện tích) và FIXED_MONTH (cố định tháng)
5. Tổng hợp thành invoice

---

### 2. [CLIENT] Tạo hóa đơn với ảnh
**POST** `/invoices/client`

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `waterIndex`: 100
- `electricityIndex`: 200
- `period`: "2024-01-05T10:15:30Z"
- `waterImage`: File (ảnh đồng hồ nước)
- `electricityImage`: File (ảnh đồng hồ điện)

**Mô tả:**
- Cư dân tạo hóa đơn và gửi ảnh chứng minh
- Tự động lấy apartmentId từ token (residentId)
- Upload ảnh lên Cloudinary
- Lưu meter readings với `isVerified = false`
- Admin cần verify sau

---

### 3. [ADMIN] Cập nhật hóa đơn
**PATCH** `/invoices/:id`

**Request Body:**
```json
{
  "waterIndex": 100,
  "electricityIndex": 200,
  "apartmentId": 1,
  "period": "2024-01-05T10:15:30Z"
}
```

**Mô tả:**
- Cập nhật hóa đơn đã tồn tại
- Xóa và tạo lại invoice_details
- Tính toán lại toàn bộ số tiền

---

### 4. [ADMIN] Xác minh chỉ số điện nước
**POST** `/invoices/verify-meter-reading`

**Request Body:**
```json
{
  "meterReadingId": 1
}
```

**Mô tả:**
- Admin xác nhận chỉ số điện nước cư dân gửi lên
- Set `isVerified = true` cho meter reading

---

### 5. Lấy danh sách hóa đơn
**GET** `/invoices`

**Query Parameters:**
- `page`: Số trang (default: 1)
- `limit`: Số lượng/trang (default: 10)
- `apartmentId`: Lọc theo căn hộ
- `status`: Lọc theo trạng thái (UNPAID/PAID/OVERDUE)
- `period`: Lọc theo tháng (YYYY-MM)

**Response:**
```json
[
  {
    "id": 1,
    "invoiceCode": "INV-202401-A101",
    "apartmentId": 12,
    "period": "2024-01-01",
    "totalAmount": 1500000.00,
    "status": "UNPAID",
    "createdAt": "2024-01-05T10:15:30Z",
    "updatedAt": "2024-01-05T10:15:30Z"
  }
]
```

---

### 6. Lấy chi tiết hóa đơn
**GET** `/invoices/:id`

**Response:**
```json
{
  "id": 1,
  "invoiceCode": "INV-202401-A101",
  "apartmentId": 12,
  "period": "2024-01-01",
  "totalAmount": 1500000.00,
  "status": "UNPAID",
  "invoiceDetails": [
    {
      "id": 1,
      "feeTypeId": 1,
      "feeTypeName": "Tiền điện",
      "amount": 100,
      "unitPrice": null,
      "totalPrice": 160000,
      "calculationBreakdown": {
        "Bậc 1": "50*1600",
        "Bậc 2": "50*1700"
      }
    },
    {
      "id": 2,
      "feeTypeId": 2,
      "feeTypeName": "Tiền nước",
      "amount": 50,
      "unitPrice": null,
      "totalPrice": 100000,
      "calculationBreakdown": {
        "Bậc 1": "10*8000",
        "Bậc 2": "40*8500"
      }
    }
  ],
  "createdAt": "2024-01-05T10:15:30Z",
  "updatedAt": "2024-01-05T10:15:30Z"
}
```

---

### 7. [ADMIN] Xóa mềm hóa đơn
**DELETE** `/invoices/:id`

**Mô tả:**
- Xóa mềm hóa đơn (soft delete)
- Set `deletedAt` timestamp

---

## Logic tính toán bậc thang

**Ví dụ:** Tiêu thụ điện 100 kWh với bậc thang:
- Bậc 1: 0-50 kWh = 1600đ/kWh
- Bậc 2: 51-100 kWh = 1700đ/kWh
- Bậc 3: >100 kWh = 1800đ/kWh

**Tính toán:**
```
Bậc 1: 50 kWh * 1600 = 80,000đ
Bậc 2: 50 kWh * 1700 = 85,000đ
Tổng: 165,000đ

Breakdown: {
  "Bậc 1": "50*1600",
  "Bậc 2": "50*1700"
}
```

## Authentication & Authorization

Tất cả endpoints yêu cầu:
- `@UseGuards(JwtAuthGuard, RolesGuard)`
- `@ApiBearerAuth()`

**Phân quyền:**
- **ADMIN**: Có thể tạo, cập nhật, xóa hóa đơn, verify meter readings
- **RESIDENT**: Chỉ có thể tạo hóa đơn với ảnh chứng minh, xem hóa đơn của mình

## Migrations

3 migrations đã được tạo:
1. `1768200000000-CreateMeterReadingsTable.ts`
2. `1768210000000-CreateInvoicesTable.ts`
3. `1768220000000-CreateInvoiceDetailsTable.ts`

## Cấu hình cần thiết

### Fee Configuration
Cần có các fee types:
- **Tiền điện**: type = METERED, với các fee_tiers
- **Tiền nước**: type = METERED, với các fee_tiers
- **Phí quản lý**: type = FIXED_AREA (tính theo m²)
- **Phí dịch vụ**: type = FIXED_MONTH (cố định tháng)

### Cloudinary
Đã tích hợp Cloudinary để upload ảnh chứng minh

## Notes

- Invoice code format: `INV-YYYYMM-A{apartmentName}`
- Mỗi kỳ thanh toán chỉ có 1 hóa đơn/căn hộ
- Chỉ số mới phải > chỉ số cũ
- Client tạo invoice → isVerified = false → Admin verify
- Admin tạo invoice → isVerified = true
