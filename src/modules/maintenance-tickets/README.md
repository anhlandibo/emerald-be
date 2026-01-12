# Maintenance Tickets Module

Module quản lý phiếu bảo trì và sự cố cho tài sản thiết bị.

## API Endpoints

### 1. Tạo phiếu mới
**POST** `/maintenance-tickets`
- **Auth**: ADMIN, RESIDENT
- **Body**: CreateMaintenanceTicketDto
- **Response**: MaintenanceTicketDetailDto

### 2. Lấy danh sách phiếu
**GET** `/maintenance-tickets`
- **Auth**: ADMIN
- **Query**: type, status, priority, blockId, technicianId, assetId
- **Response**: MaintenanceTicketListItemDto[]

### 3. Lấy chi tiết 1 phiếu
**GET** `/maintenance-tickets/:id`
- **Auth**: ADMIN, RESIDENT
- **Response**: MaintenanceTicketDetailDto

### 4. Phân công kỹ thuật viên
**POST** `/maintenance-tickets/:id/assign`
- **Auth**: ADMIN
- **Body**: AssignTechnicianDto
- **Response**: MaintenanceTicketDetailDto

### 5. Bắt đầu công việc
**POST** `/maintenance-tickets/:id/start`
- **Auth**: ADMIN
- **Response**: MaintenanceTicketDetailDto
- **Logic**: 
  - Status: ASSIGNED → IN_PROGRESS
  - Asset status: → MAINTENANCE

### 6. Cập nhật tiến độ
**POST** `/maintenance-tickets/:id/progress`
- **Auth**: ADMIN
- **Body**: UpdateProgressDto (checklistItems)
- **Response**: MaintenanceTicketDetailDto

### 7. Hoàn tất nghiệm thu
**POST** `/maintenance-tickets/:id/complete`
- **Auth**: ADMIN
- **Body**: CompleteMaintenanceDto
- **Response**: MaintenanceTicketDetailDto
- **Logic**:
  - Tính toán: totalCost = materialCost + laborCost
  - Result = GOOD → Asset: ACTIVE, update lastMaintenanceDate, recalc nextMaintenanceDate
  - Result = NEEDS_REPAIR → Asset: BROKEN
  - Result = MONITORING → Asset: ACTIVE + note

### 8. Hủy phiếu
**POST** `/maintenance-tickets/:id/cancel`
- **Auth**: ADMIN
- **Body**: CancelTicketDto
- **Response**: MaintenanceTicketDetailDto
- **Logic**: If Asset was MAINTENANCE → return to ACTIVE

## Enums

### TicketType
- INCIDENT - Sự cố
- MAINTENANCE - Bảo trì định kỳ

### TicketStatus
- PENDING - Chờ xử lý
- ASSIGNED - Đã phân công
- IN_PROGRESS - Đang thực hiện
- COMPLETED - Hoàn thành
- CANCELLED - Đã hủy

### TicketPriority
- LOW - Thấp
- MEDIUM - Trung bình (default)
- HIGH - Cao
- URGENT - Khẩn cấp

### MaintenanceResult
- GOOD - Hoạt động tốt
- NEEDS_REPAIR - Cần sửa chữa
- MONITORING - Cần theo dõi

## Integration với Assets Module

Service tự động cập nhật trạng thái asset:
- Start work → Asset: MAINTENANCE
- Complete (GOOD) → Asset: ACTIVE + update maintenance dates
- Complete (NEEDS_REPAIR) → Asset: BROKEN
- Complete (MONITORING) → Asset: ACTIVE + note
- Cancel → Asset: ACTIVE (nếu đang MAINTENANCE)

## Migration

File: `1768230000000-CreateMaintenanceTicketsTable.ts`

Seed data bao gồm:
- 1 ticket PENDING (bảo trì thang máy)
- 1 ticket ASSIGNED (sửa máy bơm)
- 1 ticket COMPLETED (kiểm tra camera)

## Notes

- Validate asset tồn tại khi tạo ticket với assetId
- Validate technician tồn tại khi assign
- Checklist items chỉ hiển thị cho tickets MAINTENANCE type
- Cost fields: materialCost, laborCost, totalCost, estimatedCost, actualCost
