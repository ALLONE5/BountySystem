# 测试账号信息

## 默认测试账号

所有测试账号的密码都是：**`Password123`**

### 超级管理员
- **用户名**: `admin`
- **邮箱**: `admin@example.com`
- **密码**: `Password123`
- **角色**: super_admin
- **权限**: 完全访问权限

### 岗位管理员
- **用户名**: `manager1`
- **邮箱**: `manager1@example.com`
- **密码**: `Password123`
- **角色**: position_admin
- **管理岗位**: Frontend Developer, Backend Developer, UI/UX Designer

### 开发人员
- **用户名**: `developer1`
- **邮箱**: `dev1@example.com`
- **密码**: `Password123`
- **角色**: user
- **岗位**: Frontend Developer

- **用户名**: `developer2`
- **邮箱**: `dev2@example.com`
- **密码**: `Password123`
- **角色**: user
- **岗位**: Backend Developer

### 设计师
- **用户名**: `designer1`
- **邮箱**: `designer1@example.com`
- **密码**: `Password123`
- **角色**: user
- **岗位**: UI/UX Designer

### 普通用户
- **用户名**: `user1`, `user2`, `user3`
- **邮箱**: `user1@example.com`, `user2@example.com`, `user3@example.com`
- **密码**: `Password123`
- **角色**: user
- **岗位**: 无

## 登录方式

你可以使用用户名或邮箱登录：

### 使用用户名登录
```
用户名: admin
密码: Password123
```

### 使用邮箱登录
```
邮箱: admin@example.com
密码: Password123
```

## 注意事项

1. **密码要求**：
   - 至少8个字符
   - 包含至少一个大写字母
   - 包含至少一个小写字母
   - 包含至少一个数字

2. **用户名要求**：
   - 3-50个字符
   - 只能包含字母、数字、下划线和连字符

3. **邮箱要求**：
   - 有效的邮箱格式
   - 最多255个字符

## 重置测试数据

如果需要重置测试数据，运行：

```bash
cd packages/database
node scripts/seed_data.js
```

这将重新创建所有测试账号和示例数据。

## 创建新账号

### 通过前端注册
1. 访问 http://localhost:5173/auth/register
2. 填写注册表单
3. 使用新账号登录

### 通过API注册
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "newuser@example.com",
    "password": "NewPassword123"
  }'
```

## 常见问题

### Q: 忘记密码怎么办？
A: 目前系统没有密码重置功能。在开发环境中，你可以：
1. 使用默认测试账号（密码：`Password123`）
2. 重新运行种子数据脚本重置所有账号

### Q: 为什么登录失败？
A: 检查以下几点：
1. 密码是否正确（`Password123`，注意大小写）
2. 用户名或邮箱是否正确
3. 是否触发了速率限制（等待1分钟或运行 `npm run clear-rate-limits`）
4. 后端服务是否正常运行

### Q: 如何测试不同角色的权限？
A: 使用不同的测试账号登录：
- `admin` - 测试超级管理员功能
- `manager1` - 测试岗位管理员功能
- `developer1` - 测试普通用户功能
