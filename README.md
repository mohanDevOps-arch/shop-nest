# E-Commerce Microservices Application

A full-stack MERN e-commerce application built with microservices architecture, featuring 4 separate Node.js backend services and a React frontend.

## 🏗️ Architecture Overview

This application demonstrates modern microservices architecture with the following components:

```
Frontend (React) → API Gateway → Microservices
                                    ├── User Service (3001)
                                    ├── Product Service (3002)
                                    ├── Cart Service (3003)
                                    └── Order Service (3004)
```

## 🔧 Technology Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens
- **Architecture**: RESTful APIs with microservices

### Frontend
- **Framework**: React 18
- **Routing**: React Router
- **State Management**: React Query + Context API
- **HTTP Client**: Axios
- **Styling**: CSS3 with responsive design

## 📦 Microservices

### 1. User Service (Port 3001)
- User registration and authentication
- Profile management
- JWT token generation and validation
- User data persistence

**Endpoints:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Get current user
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### 2. Product Service (Port 3002)
- Product catalog management
- Category management
- Product search and filtering
- Inventory tracking

**Endpoints:**
- `GET /api/products` - Get products with filtering/pagination
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Soft delete product (admin)
- `POST /api/products/:id/reviews` - Add a review (logged in, one per user)
- `POST /api/products/:id/stock` - Adjust stock (internal, used by Order Service)
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category (admin)

### 3. Cart Service (Port 3003)
- Shopping cart management
- Add/remove/update cart items
- Cart validation
- Integration with Product Service

**Endpoints:**
- `GET /api/cart/:userId` - Get user's cart
- `POST /api/cart/:userId/items` - Add item to cart
- `PUT /api/cart/:userId/items/:productId` - Update cart item
- `DELETE /api/cart/:userId/items/:productId` - Remove cart item
- `DELETE /api/cart/:userId` - Clear entire cart
- `POST /api/cart/:userId/validate` - Validate cart items

### 4. Order Service (Port 3004)
- Order creation and management
- Payment processing simulation
- Order status tracking
- Integration with Cart and Product Services

**Endpoints:**
- `GET /api/orders` - Get all orders + revenue stats (admin)
- `GET /api/orders/user/:userId` - Get user's orders (owner or admin)
- `GET /api/orders/:id` - Get single order (owner or admin)
- `POST /api/orders` - Create new order from the logged-in user's cart
- `POST /api/orders/quote` - Preview shipping, tax and total
- `PUT /api/orders/:id/status` - Update order status (admin)
- `DELETE /api/orders/:id` - Cancel order before it ships (owner or admin)
- `POST /api/payments/process` - Process payment (simulated)
- `POST /api/payments/refund` - Process refund (admin)

> Routes marked admin/owner require an `Authorization: Bearer <token>` header from the User Service. All services must share the same `JWT_SECRET`.

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- MongoDB running locally on `mongodb://localhost:27017` (or set `MONGODB_URI` per service)

### 1. Install dependencies

```bash
cd backend/user-service && npm install
cd ../product-service && npm install
cd ../cart-service && npm install
cd ../order-service && npm install
cd ../../frontend && npm install
```

### 2. Load sample data

```bash
cd backend/user-service && npm run seed      # 2 demo accounts
cd ../product-service && npm run seed        # 6 categories, 30 products
```

> The product seed **replaces** all products and categories. Demo users are only created if they don't exist yet.

### 3. Run the application

Start each one in its own terminal:

```bash
cd backend/user-service && npm run dev      # 3001
cd backend/product-service && npm run dev   # 3002
cd backend/cart-service && npm run dev      # 3003
cd backend/order-service && npm run dev     # 3004
cd frontend && npm start                    # 3000
```

Then open http://localhost:3000.

### Demo Accounts

| Role     | Email            | Password   |
|----------|------------------|------------|
| Customer | `demo@shop.com`  | `demo123`  |
| Admin    | `admin@shop.com` | `admin123` |

The login page has buttons that fill these in. The admin account sees an **Admin** link in the header.

### Test Payments

Payments are simulated. Any 16-digit card number succeeds, except `4000 0000 0000 0002`, which is always declined (useful for testing the "Retry Payment" flow). Cash on delivery orders are marked paid when an admin marks them delivered.

### Environment Variables (optional)

Every value below has a working default for local development. Create `.env` files only to override them.

**backend/user-service/.env:**
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/ecommerce_users
JWT_SECRET=your-jwt-secret-key
```

**backend/product-service/.env:**
```env
PORT=3002
MONGODB_URI=mongodb://localhost:27017/ecommerce_products
JWT_SECRET=your-jwt-secret-key
```

**backend/cart-service/.env:**
```env
PORT=3003
MONGODB_URI=mongodb://localhost:27017/ecommerce_carts
PRODUCT_SERVICE_URL=http://localhost:3002
```

**backend/order-service/.env:**
```env
PORT=3004
MONGODB_URI=mongodb://localhost:27017/ecommerce_orders
JWT_SECRET=your-jwt-secret-key
CART_SERVICE_URL=http://localhost:3003
PRODUCT_SERVICE_URL=http://localhost:3002
USER_SERVICE_URL=http://localhost:3001
```

**frontend/.env:**
```env
REACT_APP_USER_SERVICE_URL=http://localhost:3001
REACT_APP_PRODUCT_SERVICE_URL=http://localhost:3002
REACT_APP_CART_SERVICE_URL=http://localhost:3003
REACT_APP_ORDER_SERVICE_URL=http://localhost:3004
```

> `JWT_SECRET` must be identical in the user, product and order services, because the product and order services verify the tokens the user service issues.

## 🎯 Features

### Customer Features
- **Authentication**: Register and log in with JWT. Protected pages send you back where you were after you log in.
- **Product Browsing**: Category chips, partial-match search (header and products page), price filters, featured filter, sorting and pagination, all reflected in the URL
- **Product Pages**: Breadcrumbs, specifications, stock badges, "You may also like" recommendations
- **Reviews & Ratings**: Star ratings and written reviews, one per customer per product
- **Shopping Cart**: Add, update and remove items, with stock checks that include what's already in the cart
- **Checkout**: Saved address prefill, delivery options, live shipping/tax quote from the Order Service, card / PayPal / cash on delivery
- **Order Management**: Order history, cancel before shipping (with stock restored and payment refunded), retry failed payments, "Buy Again"
- **Profile Management**: Update personal information and addresses
- **Notifications**: Toast messages for cart and order actions

### Admin Features
- **Dashboard**: Revenue, active orders and orders awaiting fulfilment
- **Order Management**: Filter by status and move orders through confirmed → processing → shipped → delivered, or cancel them
- **Product Management**: Add, edit and remove products; low-stock highlighting

### Technical Features
- **Microservices Architecture**: Loosely coupled services
- **RESTful APIs**: Standard HTTP methods and status codes
- **Role-based Access**: Admin-only routes enforced in the product and order services
- **Cross-Service Communication**: HTTP-based service interactions
- **Seed Data**: One command loads a realistic catalog
- **Responsive Design**: Mobile-friendly user interface
- **Error Handling & Loading States**: Comprehensive error management

## 📁 Project Structure

```
ecommerce-microservices/
├── backend/
│   ├── user-service/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── server.js
│   │   └── package.json
│   ├── product-service/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── server.js
│   │   └── package.json
│   ├── cart-service/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── server.js
│   │   └── package.json
│   └── order-service/
│       ├── models/
│       ├── routes/
│       ├── server.js
│       └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## 🔧 API Testing

You can test the APIs using tools like Postman or curl:

```bash
# Health check for all services
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health

# Register a new user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@example.com","password":"password123"}'

# Get products
curl http://localhost:3002/api/products

# Get categories
curl http://localhost:3002/api/categories
```

## 🚀 Deployment

### Production Considerations

1. **Environment Variables**: Use proper environment variable management
2. **Database**: Use MongoDB Atlas or other managed database services
3. **Process Management**: Use PM2 or similar for process management
4. **Load Balancing**: Implement load balancing for high availability
5. **Monitoring**: Add logging and monitoring solutions
6. **Security**: Implement rate limiting, CORS, and other security measures

### Docker Deployment

Every service and the frontend has its own `Dockerfile`, and `docker-compose.yml` in the project root runs them all against a MongoDB instance such as MongoDB Atlas.

1. **Configure** – copy the example env file and fill in your values:
   ```bash
   cp .env.example .env
   ```
   ```env
   MONGO_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/   # must end with "/"
   JWT_SECRET=<long random string>
   ```
   Each service appends its own database name (`ecommerce_users`, `ecommerce_products`, `ecommerce_carts`, `ecommerce_orders`). `.env` is git-ignored, so keep credentials there and nowhere else.

2. **Build and start**:
   ```bash
   docker compose up --build -d
   ```

3. **Seed sample data** (optional; the product seed **replaces** existing products and categories):
   ```bash
   docker compose run --rm user-service npm run seed
   docker compose run --rm product-service npm run seed
   ```

4. Open http://localhost:3000.

| Container | Host port | Notes |
|-----------|-----------|-------|
| frontend | 3000 | nginx serving the production React build |
| user-service | 3001 | |
| product-service | 3002 | |
| cart-service | 3003 | starts after product-service is healthy |
| order-service | 3004 | starts after cart and product services are healthy |

Services reach each other by container name (e.g. `http://product-service:3002`). The browser reaches them on the published host ports, which are baked into the frontend at build time. If you deploy somewhere other than `localhost`, change the `REACT_APP_*` build args in `docker-compose.yml` and rebuild the frontend.

> **Atlas network access:** the machine running Docker must be allowed in your Atlas project's *Network Access* IP list.

Useful commands: `docker compose logs -f order-service`, `docker compose ps`, `docker compose down`.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review API endpoints and expected payloads
- Ensure all services are running
- Verify database connections
- Check environment variables

## 🔮 Future Enhancements

- **API Gateway**: Centralized request routing and authentication
- **Message Queues**: Async communication between services
- **Caching**: Redis caching for improved performance
- **Search Engine**: Elasticsearch for advanced product search
- **File Upload**: Image upload and management
- **Email Service**: Order confirmations and notifications
- **Analytics**: Order and user analytics
- **Payment Integration**: Real payment gateway integration
