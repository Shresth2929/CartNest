# CartNest entity relationships

```mermaid
erDiagram
  User ||--o{ Address : owns
  User ||--o| Cart : has
  User ||--o{ Order : places
  User ||--o{ AuditLog : acts
  User ||--o{ IdempotencyRecord : owns
  User ||--o{ InventoryMovement : performs
  User ||--o{ OrderStatusHistory : changes
  Category ||--o{ Product : groups
  Product ||--o{ ProductVariant : offers
  Cart ||--o{ CartItem : contains
  Product ||--o{ CartItem : referenced_by
  ProductVariant o|--o{ CartItem : selected_as
  Order ||--o{ OrderItem : snapshots
  Order ||--o{ Payment : paid_by
  Order ||--o{ OrderStatusHistory : records
  Order ||--o{ InventoryMovement : causes
  Address o|--o{ Order : ships_to
  Product ||--o{ OrderItem : referenced_by
  ProductVariant o|--o{ OrderItem : selected_as
  Product ||--o{ InventoryMovement : tracked_by
  ProductVariant o|--o{ InventoryMovement : tracked_by

  User {
    string id PK
    string email UK
    string passwordHash
    string role
  }
  Address {
    string id PK
    string userId FK
    string fullName
    string postalCode
  }
  Category {
    string id PK
    string name UK
    string slug UK
    boolean isActive
  }
  Product {
    string id PK
    string categoryId FK
    string sku UK
    decimal basePrice
    int stock
    boolean isActive
  }
  ProductVariant {
    string id PK
    string productId FK
    string sku UK
    decimal priceAdjustment
    int stock
  }
  Cart {
    string id PK
    string userId FK_UK
  }
  CartItem {
    string id PK
    string cartId FK
    string productId FK
    string variantId FK
    int quantity
  }
  Order {
    string id PK
    string userId FK
    string shippingAddressId FK
    string orderNumber UK
    string idempotencyKey UK
    string status
    decimal total
  }
  OrderItem {
    string id PK
    string orderId FK
    string productId FK
    string variantId FK
    decimal unitPrice
    int quantity
  }
  Payment {
    string id PK
    string orderId FK
    string status
    decimal amount
  }
  AuditLog {
    string id PK
    string userId FK
    string action
    string entityType
    string entityId
  }
  InventoryMovement {
    string id PK
    string productId FK
    string variantId FK
    string orderId FK
    string actorId FK
    int delta
    int stockAfter
  }
  OrderStatusHistory {
    string id PK
    string orderId FK
    string actorId FK
    string fromStatus
    string toStatus
  }
  IdempotencyRecord {
    string id PK
    string key UK
    string userId FK
    string requestHash
    string orderId
  }
```

The schema source of truth is `backend/prisma/schema.prisma`. Product/order item names and unit prices are snapshots so existing order history does not change when the catalogue is edited.
