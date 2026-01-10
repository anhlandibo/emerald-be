## Tạo migration mới
```bash
npm run migration:generate src/migrations/AddAgeToAccounts
```

## Chạy migration
```bash
npm run migration:run
```

## Quay lại migration
```bash
npm run migration:revert
```

## Quy trình
### Viết migration
```bash
# 1. Thay đổi entity
# 2. Sinh migration
npm run migration:generate src/migrations/AddPhoneToAccounts
# 3. Chạy migration trên local
npm run migration:run
# 4. Commit và push
git add .
git commit -m "feat: add phone to accounts table"
git push
```

### Pull code về:

```bash
# 1. Pull code
git pull origin main
# 2. Nếu có file migration mới, chạy:
npm run migration:run
# 3. App tự động có schema mới
```


## Start Application
```bash
npm run start:dev
```