# FoodOrder Backend - Admin Documentation

## Default Admin Account

When the application starts for the first time, a default admin account is automatically created.

### Admin Credentials

```
Username: admin
Password: admin123
Email: admin@foodorder.com
```

### Security Notes

🔒 **IMPORTANT**: Please change these default credentials after your first login for security purposes.

### Admin Capabilities

- Create additional admin accounts using the `/auth/create-admin` endpoint
- Manage restaurant operations
- View all users and orders
- Full system access

### Creating Additional Admin Users

To create additional admin users, existing admins can use the secure endpoint:

**Endpoint**: `POST /auth/create-admin`

**Headers**: 
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body**:
```json
{
    "username": "new-admin",
    "email": "newadmin@foodorder.com", 
    "password": "secure-password"
}
```

### User Registration Security

- Regular user registration automatically assigns "CUSTOMER" role
- Users cannot select "ADMIN" role during registration
- Only existing admins can create new admin accounts
- All passwords are encrypted using BCrypt

## API Endpoints

### Public Endpoints
- `POST /auth/register` - Register new customer account
- `POST /auth/login` - Login with username/password
- `GET /foods` - View all menu items (public access)
- `GET /foods/{id}` - View specific food item

### Admin-Only Endpoints (Require Authorization Header)
- `POST /auth/create-admin` - Create new admin account
- `POST /foods` - Add new menu item
- `PUT /foods/{id}` - Update existing menu item
- `DELETE /foods/{id}` - Delete menu item (only if no active orders)

### Customer Endpoints (Login Required)
- `POST /orders` - Place new food order
- `GET /orders` - View order history

### Menu Management Security
- Only admins can add, edit, or delete menu items
- Menu items cannot be deleted if they have pending/active orders
- Public users can only view the menu, not modify it

### Authentication
- JWT tokens expire after 10 hours
- Include token in Authorization header: `Bearer <token>`
- Admin endpoints return 401/403 errors for unauthorized access
