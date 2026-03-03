# 📘 Sports Price Tracker — Project Proposal

> **React Native Mobile Application Development**
> **Team Size:** 2 Developers | **Timeline:** One semester

---

## 1. Executive Summary

**Sports Price Tracker** là mobile application được xây dựng bằng **React Native (Expo)**, giúp người dùng theo dõi và so sánh giá các sản phẩm thể thao (giày chạy bộ, vợt tennis, túi gym, fitness trackers, quần áo thể thao) từ nhiều cửa hàng khác nhau.

**Ứng dụng cho phép:**

- So sánh giá giữa nhiều store
- Theo dõi lịch sử biến động giá
- Lưu sản phẩm yêu thích
- Nhận phân tích deal thông minh từ **Gemini AI**

Dữ liệu được quản lý tập trung trong **Supabase PostgreSQL**, sử dụng **Row Level Security (RLS)** để đảm bảo bảo mật theo từng user.

---

## 2. Project Objectives

1. Xây dựng mobile app hoàn chỉnh với **authentication** và **database integration**
2. Thiết kế navigation mượt mà với multiple screens
3. Thực hiện **CRUD operations** với Supabase
4. Xây dựng hệ thống **price tracking** theo thời gian
5. Tích hợp **AI** để phân tích chất lượng deal dựa trên dữ liệu thực tế

---

## 3. Technology Stack

### 3.1 Frontend (Mobile Application)

| Technology | Mục đích |
|---|---|
| **React Native (Expo)** | Framework cross-platform chính (iOS & Android) |
| **Expo SDK** | Development nhanh, testing dễ, build không cần config native phức tạp |
| **TypeScript** | Type safety, code rõ ràng và dễ maintain |
| **Expo Router / React Navigation** | Điều hướng: Auth Flow, Bottom Tabs, Stack Navigation |
| **React Native Paper** | UI component library nhất quán, chuyên nghiệp |
| **react-native-chart-kit** | Biểu đồ price history (Line Chart) |

### 3.2 Backend & Database

| Technology | Mục đích |
|---|---|
| **Supabase** | PostgreSQL database + Auth + Row Level Security |
| **PostgreSQL** | Lưu trữ products, prices, price history, favorites |

### 3.3 AI Integration

| Technology | Mục đích |
|---|---|
| **Google Gemini API (gemini-2.5-flash)** | Phân tích deal dựa trên current price, discount %, 15-day avg, trend |
| **Fetch API / Axios** | HTTP request đến Gemini endpoint |

### 3.4 State & Data Management

- **React Hooks** (`useState`, `useEffect`, custom hooks)
- **Service layer pattern** — tách biệt UI và database logic
- **Async/Await** cho xử lý bất đồng bộ

### 3.5 Development Tools

- **Node.js** + **npm**
- **Git & GitHub** (Version Control)
- **Expo Go** (Testing trên thiết bị thật)
- **Supabase Dashboard** (Database management)

---

## 4. System Architecture

### 4.1 Data Strategy

- **Supabase** là nguồn dữ liệu duy nhất (Single Source of Truth)
- Mock data chỉ dùng để **seed dữ liệu ban đầu**
- Không sử dụng Realtime subscription (demo level)
- Giá được **giả lập thay đổi** mỗi lần app load

### 4.2 Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│                  Mobile App                     │
│  (React Native / Expo / TypeScript)             │
│                                                 │
│  ┌───────────┐  ┌───────────┐  ┌────────────┐  │
│  │   Home    │  │ Favorites │  │  Profile   │  │
│  │  (Tab)    │  │  (Tab)    │  │  (Tab)     │  │
│  └─────┬─────┘  └───────────┘  └────────────┘  │
│        │                                        │
│  ┌─────▼──────────────┐                         │
│  │  Product Detail    │                         │
│  │  (Stack Screen)    │                         │
│  └─────┬──────────────┘                         │
│        │                                        │
│  ┌─────▼──────────────┐                         │
│  │  Service Layer     │                         │
│  │  (Custom Hooks)    │                         │
│  └─────┬─────────┬────┘                         │
└────────┼─────────┼──────────────────────────────┘
         │         │
    ┌────▼────┐ ┌──▼──────────┐
    │Supabase │ │ Gemini API  │
    │(DB+Auth)│ │(Deal Score) │
    └─────────┘ └─────────────┘
```

---

## 5. Database Design

### 5.1 Entity Relationship

```
products ──< product_prices >── stores
    │
    ├──< price_history
    │
    └──< favorites >── auth.users
```

### 5.2 Table Schema

#### `products`

| Column | Type | Constraint |
|---|---|---|
| id | uuid | PRIMARY KEY |
| name | text | NOT NULL |
| brand | text | NOT NULL |
| image_url | text | |
| created_at | timestamptz | DEFAULT now() |

#### `stores`

| Column | Type | Constraint |
|---|---|---|
| id | uuid | PRIMARY KEY |
| name | text | NOT NULL |
| logo_url | text | |

#### `product_prices`

| Column | Type | Constraint |
|---|---|---|
| id | uuid | PRIMARY KEY |
| product_id | uuid | FK → products.id |
| store_id | uuid | FK → stores.id |
| price | decimal | NOT NULL |
| updated_at | timestamptz | DEFAULT now() |

#### `price_history`

| Column | Type | Constraint |
|---|---|---|
| id | uuid | PRIMARY KEY |
| product_id | uuid | FK → products.id |
| price | decimal | NOT NULL |
| recorded_at | timestamptz | DEFAULT now() |

#### `favorites`

| Column | Type | Constraint |
|---|---|---|
| id | uuid | PRIMARY KEY |
| user_id | uuid | FK → auth.users |
| product_id | uuid | FK → products.id |
| created_at | timestamptz | DEFAULT now() |
| | | UNIQUE(user_id, product_id) |

### 5.3 Row Level Security (RLS)

- Bảng `favorites`: Users chỉ **SELECT / INSERT / DELETE** records có `user_id = auth.uid()`
- Các bảng khác (`products`, `stores`, `product_prices`, `price_history`): **Public read** cho authenticated users

---

## 6. Core Features — Implementation Guide

> Mỗi Task dưới đây tương ứng với một milestone trong quá trình phát triển.

### Task 1: Authentication & Navigation

**Authentication:**

- Email/Password **login & signup** với Supabase Auth
- **Session persistence** (auto-login khi mở lại app)
- **Route protection** (redirect về Login nếu chưa đăng nhập)

**Navigation Structure:**

```
Auth Stack
├── LoginScreen
└── SignupScreen

Main (Bottom Tabs)
├── HomeScreen (Tab)
│   └── ProductDetailScreen (Stack)
├── FavoritesScreen (Tab)
└── ProfileScreen (Tab)
```

---

### Task 2: Product Listing (Home Screen)

Hiển thị danh sách sản phẩm dạng **card**, mỗi card bao gồm:

- Image | Product name | Brand | **Lowest price** (tính từ nhiều store)

**Tính năng:**

- Filter theo **brand**
- Sort theo giá **thấp → cao**
- FlatList optimization (`keyExtractor`, `React.memo`)
- Dữ liệu được lấy từ **Supabase**

---

### Task 3: Product Detail Screen

Hiển thị thông tin chi tiết sản phẩm:

- Hình ảnh lớn
- Tên sản phẩm & Brand
- **Bảng so sánh giá** giữa các store (highlight "Best Price")
- **Biểu đồ price history** 30 ngày
- Nút **Follow / Unfollow**
- Nút **"Analyze Deal"** (gọi Gemini AI)

---

### Task 4: Multi-Store Price Comparison

Mỗi sản phẩm có nhiều mức giá từ nhiều cửa hàng.

User có thể:

- Xem **tất cả giá** từ các store
- Nhận biết **cửa hàng rẻ nhất** (highlighted)
- Thấy **mức tiết kiệm** so với giá cao nhất

---

### Task 5: Price History Tracking

Hệ thống lưu lịch sử giá mỗi lần app load (giả lập thay đổi giá **±1–5%**).

User có thể:

- Xem **biểu đồ line chart** 30 ngày gần nhất (`react-native-chart-kit`)
- Xem **giá trung bình** (30-day average)
- Xem **% tăng/giảm** so với ngày đầu

---

### Task 6: Favorites System

User có thể:

- **Follow / Unfollow** sản phẩm (toggle trên Product Detail)
- Xem **danh sách sản phẩm đã follow** trong Favorites Tab

Favorites được bảo vệ bởi **Row Level Security** — mỗi user chỉ thấy dữ liệu của mình.

---

### Task 7: AI Deal Analysis (Gemini Integration)

Khi user nhấn **"Analyze Deal"** trên Product Detail:

**Input gửi đến Gemini:**

- Product name
- Current price
- Discount percentage
- 30-day average price
- Price trend (up/down/stable)

**Output từ Gemini:**

- **Deal Score** (1–10)
- **Verdict** (Good / Average / Overpriced)
- **Short explanation** (giải thích ngắn gọn)

> AI phân tích dựa trên dữ liệu thực tế từ database, không sử dụng thông tin không có nguồn.

---

## 7. Price Simulation Logic

Mỗi khi **Home Screen load**, hệ thống thực hiện:

```
1. Lấy tất cả product_prices từ Supabase
2. Random thay đổi giá ±1–5% cho mỗi record
3. UPDATE giá mới vào product_prices
4. INSERT bản ghi mới vào price_history
```

> Mục đích: Tạo dữ liệu biến động giá cho demo, không cần Realtime subscription.

---

## 8. UI/UX Optimization

| Kỹ thuật | Mục đích |
|---|---|
| `FlatList` + `keyExtractor` | Render danh sách hiệu quả |
| Skeleton loading | Trải nghiệm chờ dữ liệu mượt mà |
| Pull-to-refresh | Cập nhật dữ liệu thủ công |
| `React.memo` | Tránh re-render không cần thiết |
| Responsive layout | Tương thích iOS & Android |
| Haptic feedback | Phản hồi xúc giác khi add/remove favorite |
| `SafeAreaView` | Xử lý notch / dynamic island |
| Platform-specific styles | iOS shadows vs Android elevation |

---

## 9. Scope Control

### ✅ Bao gồm (In Scope)

- Authentication (Email/Password)
- Product listing với filter & sort
- Multi-store price comparison
- Price history chart (30 ngày)
- Favorites system (RLS)
- AI deal analysis (Gemini)
- Price simulation on app load

### ❌ Không bao gồm (Out of Scope)

- Realtime subscription
- Push notifications
- Complex alert/threshold system
- Admin dashboard
- Payment integration

> Scope được kiểm soát để đảm bảo project hoàn thành trong **1 semester** với **2 developers**.

---

## 10. Expected Learning Outcomes

1. **React Native navigation** & state management
2. **Supabase** authentication & relational database
3. **CRUD operations** với PostgreSQL
4. **Data visualization** (charts) trên mobile
5. **API integration** (Gemini AI)
6. **Mobile UX optimization** (performance, platform safety)
7. **TypeScript** trong React Native project thực tế

---

## 11. Project Milestones

| Phase | Tasks | Mô tả |
|---|---|---|
| **Phase 1** | Task 1 | Setup Expo project, Supabase config, Auth flow, Navigation |
| **Phase 2** | Task 2, 6 | Database seeding, Product listing, Favorites system |
| **Phase 3** | Task 3, 4, 5 | Product Detail, Price comparison, Price history chart |
| **Phase 4** | Task 7 | Gemini AI integration, Deal analysis |
| **Phase 5** | — | Testing, UI polish, Bug fixes, Final submission |

---

## 12. Final Deliverables

- Mobile app hoàn chỉnh chạy trên **iOS & Android** (Expo Go)
- **Authentication** hoàn chỉnh (login, signup, session)
- **Multi-store price comparison** với highlight best price
- **Price history chart** 15 ngày
- **Favorite system** với Row Level Security
- **AI-powered deal evaluation** (Gemini)
- Source code trên **GitHub** với README documentation
