# Security Implementation

This document describes the security measures implemented in the Bounty Hunter Platform backend.

## Input Validation and Sanitization

### Overview
All user inputs are validated and sanitized using Zod schemas to prevent SQL injection, XSS attacks, and other security vulnerabilities.

### Implementation

#### Validation Middleware
Located in `middleware/validation.middleware.ts`, this middleware:
- Validates request body, query parameters, and route parameters
- Sanitizes strings by removing HTML tags and script content
- Enforces strict type checking and format validation
- Returns detailed error messages for invalid inputs

#### Common Validation Schemas

**String Sanitization:**
- `sanitizedStringSchema`: Removes HTML tags
- `safeTextSchema`: For names, titles (max 255 chars)
- `safeLongTextSchema`: For descriptions, comments (max 5000 chars)
- `sqlSafeStringSchema`: Prevents SQL injection keywords

**User Input:**
- `emailSchema`: Email validation with lowercase normalization
- `passwordSchema`: Minimum 8 chars, requires uppercase, lowercase, and number
- `usernameSchema`: 3-50 chars, alphanumeric with underscores/hyphens only

**Data Types:**
- `uuidSchema`: UUID format validation
- `dateSchema`: Date parsing and validation
- `positiveNumberSchema`: Positive numbers only
- `positiveIntegerSchema`: Positive integers only

### SQL Injection Prevention

1. **Parameterized Queries**: All database queries use parameterized statements
2. **Input Validation**: SQL keywords are detected and rejected
3. **Type Enforcement**: Strict type checking prevents type confusion attacks
4. **Escape Functions**: Special characters in LIKE queries are escaped

### XSS Prevention

1. **HTML Tag Removal**: All text inputs have HTML tags stripped
2. **Script Content Filtering**: JavaScript protocol and script tags are removed
3. **Content Security Policy**: CSP headers prevent inline script execution
4. **Output Encoding**: Responses are properly encoded (handled by Express)

## Rate Limiting

### Overview
Rate limiting is implemented using Redis to prevent abuse and brute force attacks.

### Implementation

#### Rate Limit Middleware
Located in `middleware/rateLimit.middleware.ts`, this middleware:
- Uses Redis for distributed rate limiting
- Implements sliding window algorithm for precise tracking
- Adds rate limit headers to responses
- Supports custom handlers for limit exceeded scenarios

#### Predefined Rate Limiters

**Global Rate Limiters:**
- `ipRateLimiter`: 60 requests/minute per IP (applied to all routes)
- `apiRateLimiter`: 100 requests/minute per user

**Authentication Rate Limiters:**
- `loginRateLimiter`: 5 attempts per 15 minutes (only counts failed attempts)
- `registrationRateLimiter`: 3 registrations per hour per IP
- `passwordResetRateLimiter`: 3 attempts per hour

**Feature-Specific Rate Limiters:**
- `taskCreationRateLimiter`: 20 tasks per hour
- `notificationRateLimiter`: 50 notifications per minute
- `strictRateLimiter`: 10 requests per minute (for sensitive operations)

### Rate Limit Headers

All rate-limited responses include:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Timestamp when the limit resets

### Rate Limit Exceeded Response

```json
{
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests, please try again later",
  "details": {
    "retryAfter": 60
  },
  "timestamp": "2024-12-11T10:30:00.000Z"
}
```

## Security Headers

The following security headers are automatically added to all responses:

### X-Frame-Options
- Value: `DENY`
- Purpose: Prevents clickjacking attacks

### X-Content-Type-Options
- Value: `nosniff`
- Purpose: Prevents MIME type sniffing

### X-XSS-Protection
- Value: `1; mode=block`
- Purpose: Enables browser XSS protection

### Strict-Transport-Security (Production only)
- Value: `max-age=31536000; includeSubDomains`
- Purpose: Forces HTTPS connections

### Content-Security-Policy
- Value: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;`
- Purpose: Prevents XSS and data injection attacks

## Payload Size Limits

- JSON payload: 10MB maximum
- URL-encoded payload: 10MB maximum

## Usage Examples

### Adding Validation to Routes

```typescript
import { validate, safeTextSchema, emailSchema } from '../middleware/validation.middleware.js';
import { z } from 'zod';

const createTaskSchema = z.object({
  name: safeTextSchema,
  description: safeLongTextSchema,
  email: emailSchema,
});

router.post('/tasks', 
  validate({ body: createTaskSchema }),
  async (req, res) => {
    // req.body is now validated and sanitized
    const { name, description, email } = req.body;
    // ... handle request
  }
);
```

### Adding Rate Limiting to Routes

```typescript
import { loginRateLimiter, strictRateLimiter } from '../middleware/rateLimit.middleware.js';

// Apply to specific route
router.post('/login', loginRateLimiter, loginHandler);

// Apply to all routes in router
router.use(strictRateLimiter);
```

### Creating Custom Rate Limiters

```typescript
import { createRateLimiter } from '../middleware/rateLimit.middleware.js';

const customRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  keyPrefix: 'custom',
  skipSuccessfulRequests: true,
});

router.post('/sensitive-operation', customRateLimiter, handler);
```

## Best Practices

1. **Always validate user input**: Use validation middleware on all routes that accept user data
2. **Use appropriate rate limiters**: Apply stricter limits to sensitive operations
3. **Sanitize output**: While input is sanitized, ensure output encoding is proper
4. **Keep dependencies updated**: Regularly update security-related packages
5. **Monitor rate limit violations**: Log and alert on suspicious patterns
6. **Use HTTPS in production**: Always use TLS/SSL for production deployments
7. **Implement CSRF protection**: For state-changing operations (future enhancement)
8. **Regular security audits**: Periodically review and test security measures

## Future Enhancements

1. **CSRF Protection**: Add CSRF tokens for state-changing operations
2. **Request Signing**: Implement request signature verification
3. **IP Whitelisting**: Allow trusted IPs to bypass rate limits
4. **Anomaly Detection**: ML-based detection of suspicious patterns
5. **Two-Factor Authentication**: Add 2FA for sensitive operations
6. **API Key Management**: Implement API keys for programmatic access
7. **Audit Logging**: Comprehensive logging of security events
8. **Penetration Testing**: Regular security testing and vulnerability scanning

## Testing

Security measures should be tested regularly:

1. **Input Validation Tests**: Test with malicious inputs (SQL injection, XSS)
2. **Rate Limit Tests**: Verify rate limiters work correctly
3. **Authentication Tests**: Test authentication bypass attempts
4. **Authorization Tests**: Verify permission checks
5. **Load Tests**: Ensure rate limiters don't impact legitimate traffic

## Compliance

This implementation helps meet security requirements for:
- OWASP Top 10 protection
- Data protection regulations (GDPR, CCPA)
- Industry security standards (PCI DSS where applicable)

## Support

For security concerns or to report vulnerabilities, contact the security team immediately.
