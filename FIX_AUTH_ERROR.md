# 🔧 Fix Lỗi Authentication 400 Bad Request

## 🐛 Vấn đề

Lỗi 400 Bad Request khi app khởi động trong `<AuthProvider>` component:

```
POST https://[your-project].supabase.co/auth/v1/token?grant_type=password
400 (Bad Request)
```

## ✅ Đã Fix

### 1. **AuthContext với Error Handling tốt hơn**

Đã cập nhật [AuthContext.tsx](src/context/AuthContext.tsx) với:

- ✅ **Try-catch trong init()**: Bắt lỗi khi get user session
- ✅ **Auto clear corrupt session**: Tự động xóa session lỗi và reset
- ✅ **Better error logging**: Console log để dễ debug
- ✅ **Finally block**: Đảm bảo setLoading(false) luôn được gọi

### 2. **Nguyên nhân thường gặp**

Lỗi 400 Bad Request thường do:

- ❌ **Session cũ bị corrupt**: Token đã expire hoặc invalid
- ❌ **Refresh token không còn valid**: Supabase không thể refresh
- ❌ **AsyncStorage có dữ liệu cũ**: Cache từ lần chạy trước

## 🚀 Cách Fix

### Bước 1: Clear AsyncStorage (Khuyến nghị)

Dừng app và chạy lệnh để clear cache:

```bash
# Stop tất cả terminals đang chạy (Ctrl+C)

# Clear cache và bundler
npx expo start -c

# Hoặc clear AsyncStorage trong app
```

### Bước 2: Manual Clear Storage (Nếu bước 1 không work)

Thêm code này vào app tạm thời để clear storage:

1. Mở file [app/index.tsx](app/index.tsx)
2. Thêm ở đầu file:

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";

// TEMPORARY: Clear storage on app start
useEffect(() => {
  AsyncStorage.clear().then(() => {
    console.log("🧹 AsyncStorage cleared!");
  });
}, []);
```

3. Reload app
4. **XÓA CODE này sau khi test**, không để trong production!

### Bước 3: Restart lại từ đầu

```bash
# Terminal 1: Stop tất cả
Ctrl+C

# Clear node_modules cache (nếu cần)
npx expo start --clear

# Reload app
```

## 🔍 Kiểm tra Log

Sau khi fix, bạn sẽ thấy trong console:

### ✅ **Trường hợp tốt:**

```
✓ Auth initialized successfully
```

### ⚠️ **Trường hợp có corrupt session:**

```
⚠ Error getting user, clearing session: Invalid Refresh Token
✓ Session cleared, ready for new login
```

## 📱 Test Flow

### 1. **App khởi động lần đầu**

```
App Start → Loading spinner → Sign In page (không có lỗi đỏ!)
```

### 2. **Sign In thành công**

```
Enter credentials → Sign In → Loading → ✓ Bottom Tabs
```

### 3. **Sign Out**

```
Profile → Sign Out → Confirm → Sign In page
```

### 4. **Reload app lại** (TEST QUAN TRỌNG)

```
Reload → Loading → Bottom Tabs (vì đã có session)
```

## 🛠️ Debug Commands

### Check Supabase kết nối:

```bash
# Test Supabase URL
curl https://lgvlkfmbielktvbppotf.supabase.co/rest/v1/

# Nếu lỗi SSL hoặc network → Check firewall/internet
```

### Check AsyncStorage:

Thêm code debug vào [index.tsx](app/index.tsx):

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";

AsyncStorage.getAllKeys().then((keys) => {
  console.log("📦 Storage keys:", keys);
  // Should see: supabase.auth.token, etc.
});
```

## ⚠️ Nếu vẫn lỗi

### Option 1: Kiểm tra Supabase project

1. Vào https://app.supabase.com
2. Chọn project của bạn
3. **Settings** → **API**
4. Verify:
   - ✅ Project URL khớp với `.env`
   - ✅ Anon key khớp với `.env`
   - ✅ Project không bị pause

### Option 2: Tạo test user mới

Vào Supabase Dashboard → **Authentication** → **Users** → **Add user**

- Email: test@test.com
- Password: test123456
- Email Confirm: **Skip email confirmation**

Rồi test sign in với user này.

### Option 3: Disable Email Confirmation (Dev only)

Supabase Dashboard → **Authentication** → **Providers** → **Email**

- ☑️ **Enable email provider**
- ☐ **Confirm email** (uncheck này cho dev)

Save và test lại sign up.

## 🎯 Expected Behavior

Sau khi fix:

### ✅ **App start**

- Không có lỗi đỏ
- Loading spinner → Sign in (nếu chưa login)
- Loading spinner → Tabs (nếu đã login)

### ✅ **Sign in/up**

- Form submit → Loading → Success → Tabs
- Không có error alerts

### ✅ **Reload app**

- Session persist → Tự động vào Tabs
- Không cần sign in lại

## 📝 Notes

- ⚠️ **Development mode**: Lỗi 400 thường do cache. Production ít gặp.
- 💡 **Best practice**: Luôn có error boundary cho AuthProvider
- 🔒 **Security**: Không hardcode credentials trong code
- 🧪 **Testing**: Test cả flow: sign in → reload → sign out → sign in lại

---

## 📚 Related Files

- [AuthContext.tsx](src/context/AuthContext.tsx) - Auth logic với error handling
- [supabase.ts](src/lib/supabase.ts) - Supabase client config
- [.env](.env) - Supabase credentials
- [app/index.tsx](app/index.tsx) - Root redirect logic

---

✅ **Đã fix xong!** Restart app và test lại nhé! 🚀
