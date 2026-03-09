# Giải quyết vấn đề dữ liệu Supabase không hiển thị

## Vấn đề

Bạn đã thêm dữ liệu vào Supabase nhưng nó không hiển thị trên màn hình mobile của bạn.

## Nguyên nhân

Có 2 nguyên nhân chính:

### 1. **Row Level Security (RLS) đang chặn truy cập dữ liệu**

Supabase có tính năng bảo mật Row Level Security (RLS). Khi RLS được bật cho một bảng, **không ai có thể đọc/ghi dữ liệu trừ khi có policy cho phép**.

Trong project này:

- File `001_create_tables.sql` có dòng `grant select ... to anon` nhưng điều này chỉ hoạt động nếu RLS **TẮT**
- Nếu RLS **BẬT**, bạn cần tạo policies để cho phép đọc dữ liệu

### 2. **Dữ liệu chưa được insert đúng cách**

Có thể bạn đã add dữ liệu nhưng có lỗi constraint hoặc format không đúng.

---

## Giải pháp

### ✅ Cách 1: TẮT RLS (Đơn giản - Phù hợp cho development)

1. Vào Supabase Dashboard: https://app.supabase.com
2. Chọn project của bạn
3. Vào **Database** → **Tables**
4. Với mỗi bảng (`products`, `stores`, `product_prices`, `price_history`):
   - Click vào tên bảng
   - Vào tab **Policies** hoặc **RLS**
   - **TẮT RLS** (Disable RLS)

![RLS Toggle](https://supabase.com/docs/img/disable-rls.png)

### ✅ Cách 2: TẠO POLICIES cho RLS (Bảo mật hơn - Phù hợp cho production)

Chạy SQL queries sau trong Supabase SQL Editor:

```sql
-- ================================
-- POLICIES CHO BẢNG PRODUCTS
-- ================================

-- Bật RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Cho phép mọi người đọc products (không cần đăng nhập)
CREATE POLICY "Anyone can read products"
  ON public.products
  FOR SELECT
  USING (true);

-- ================================
-- POLICIES CHO BẢNG STORES
-- ================================

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read stores"
  ON public.stores
  FOR SELECT
  USING (true);

-- ================================
-- POLICIES CHO BẢNG PRODUCT_PRICES
-- ================================

ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read product_prices"
  ON public.product_prices
  FOR SELECT
  USING (true);

-- ================================
-- POLICIES CHO BẢNG PRICE_HISTORY
-- ================================

ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read price_history"
  ON public.price_history
  FOR SELECT
  USING (true);
```

### ✅ Cách 3: KIỂM TRA DỮ LIỆU

Kiểm tra xem dữ liệu có thực sự tồn tại không:

1. Vào Supabase Dashboard
2. **Table Editor**
3. Chọn bảng `products`
4. Xem có dữ liệu không?

Nếu KHÔNG có dữ liệu, chạy file seed:

```sql
-- Copy nội dung từ supabase/002_seed_full.sql và chạy trong SQL Editor
```

---

## Cách kiểm tra nhanh

### Test trong Supabase SQL Editor:

```sql
-- Kiểm tra xem có products không
SELECT * FROM products;

-- Kiểm tra xem có prices không
SELECT * FROM product_prices;

-- Kiểm tra xem RLS có đang bật không
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('products', 'product_prices', 'stores', 'price_history');
```

Nếu `rowsecurity = true` → RLS đang BẬT → Cần tạo policies hoặc tắt RLS

---

## Test trong React Native App

Sau khi fix RLS, restart app:

1. Dừng Metro bundler (Ctrl+C)
2. Xóa cache: `npx expo start -c`
3. Reload app

Check console log xem có error không:

- Trong [ProductList.tsx](src/components/product/ProductList.tsx) đã có `console.error` để log lỗi
- Xem React Native Debugger hoặc Terminal

---

## Checklist

- [ ] Kiểm tra RLS status của các bảng
- [ ] Chọn 1 trong 2: TẮT RLS hoặc TẠO POLICIES
- [ ] Kiểm tra dữ liệu có tồn tại trong Supabase Table Editor
- [ ] Kiểm tra `.env` file có đúng URL và ANON_KEY
- [ ] Restart app và test lại

---

## Lưu ý quan trọng

⚠️ **Cho Development/Testing**: TẮT RLS dễ dàng hơn

⚠️ **Cho Production**: NÊN BẬT RLS và tạo policies chi tiết để bảo mật

⚠️ **Favorites table**: Đã có RLS policies trong `003_policies.sql`, nên giữ nguyên (chỉ owner mới thấy favorites của mình)
