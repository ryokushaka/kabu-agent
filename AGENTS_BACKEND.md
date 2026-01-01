---
globs: ["backend/**/*.py", "api/**/*.py", "src/**/*.py", "**/*requirements*.txt", "pyproject.toml"]
description: "FastAPI backend and database development rules"
---

# Backend Development Rules

## Tech Stack

| Category | Choice | Rationale |
|----------|--------|-----------|
| Framework | FastAPI | Async-first, auto-docs, type hints |
| Validation | Pydantic v2 | Performance, native Python typing |
| Database | SQLAlchemy 2.0 | Async support, mature ecosystem |
| Migrations | Alembic | SQLAlchemy integration |
| Testing | pytest + httpx | Async support, fixtures |

## Project Structure

```
backend/
├── src/
│   ├── api/              # Route handlers (grouped by resource)
│   │   ├── v1/          # API version 1
│   │   │   ├── users.py
│   │   │   └── auth.py
│   │   └── deps.py      # Shared dependencies
│   ├── core/            # Core configuration
│   │   ├── config.py    # Settings management
│   │   └── security.py  # Auth utilities
│   ├── models/          # SQLAlchemy models
│   ├── schemas/         # Pydantic schemas
│   ├── services/        # Business logic
│   └── utils/           # Utility functions
├── tests/
├── alembic/             # Database migrations
└── main.py              # Application entry point
```

## API Design

### RESTful Conventions
| Action | Method | Path | Status |
|--------|--------|------|--------|
| List | GET | `/users` | 200 |
| Create | POST | `/users` | 201 |
| Read | GET | `/users/{id}` | 200 |
| Update | PUT | `/users/{id}` | 200 |
| Partial Update | PATCH | `/users/{id}` | 200 |
| Delete | DELETE | `/users/{id}` | 204 |

### Versioning
- Prefix all routes: `/api/v1/`
- Maintain backward compatibility within versions

### Response Format
```python
# Success
{
    "data": {...},
    "meta": {"timestamp": "2024-01-01T00:00:00Z"}
}

# Error
{
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Invalid email format",
        "details": [...]
    }
}
```

## Route Handlers

### Async First
```python
# Correct: async for I/O operations
@router.get("/users/{user_id}")
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)) -> User:
    return await user_service.get_by_id(db, user_id)

# Avoid: sync handlers for I/O
```

### Dependency Injection
```python
# Define reusable dependencies
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    return await auth_service.validate_token(db, token)

# Use in handlers
@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user
```

### Path Operations
- Use type hints for all parameters
- Document with docstrings (appears in OpenAPI)
- Return Pydantic models, not dicts

## Pydantic Schemas

### Separation of Concerns
```python
# Base: shared fields
class UserBase(BaseModel):
    email: EmailStr
    name: str

# Create: input for creation
class UserCreate(UserBase):
    password: str

# Read: output (excludes sensitive data)
class UserRead(UserBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Update: optional fields for partial updates
class UserUpdate(BaseModel):
    email: EmailStr | None = None
    name: str | None = None
```

### Validation
```python
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    age: int = Field(..., ge=0, le=150)

    @field_validator('password')
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError('must contain uppercase letter')
        return v
```

## Database

### SQLAlchemy Models
```python
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(unique=True, index=True)
    hashed_password: Mapped[str]
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(default=func.now())
```

### Async Session Management
```python
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

### Query Patterns
```python
# Use select() for queries
async def get_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(
        select(User).where(User.email == email)
    )
    return result.scalar_one_or_none()

# Eager loading for relationships
async def get_with_posts(db: AsyncSession, user_id: int) -> User | None:
    result = await db.execute(
        select(User)
        .options(selectinload(User.posts))
        .where(User.id == user_id)
    )
    return result.scalar_one_or_none()
```

### Migrations (Alembic)
```bash
# Generate migration
alembic revision --autogenerate -m "add users table"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Service Layer

### Business Logic Isolation
```python
class UserService:
    async def create(self, db: AsyncSession, data: UserCreate) -> User:
        # Check existence
        if await self.get_by_email(db, data.email):
            raise DuplicateEmailError(data.email)

        # Create user
        user = User(
            email=data.email,
            hashed_password=hash_password(data.password)
        )
        db.add(user)
        await db.flush()
        return user
```

### Error Handling
```python
# Custom exceptions
class AppException(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code

class NotFoundError(AppException):
    def __init__(self, resource: str, id: int):
        super().__init__(
            code="NOT_FOUND",
            message=f"{resource} with id {id} not found",
            status_code=404
        )

# Global exception handler
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": exc.message}}
    )
```

## Security

### Password Handling
```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)
```

### JWT Authentication
```python
from jose import jwt

def create_access_token(data: dict, expires_delta: timedelta) -> str:
    expire = datetime.utcnow() + expires_delta
    return jwt.encode(
        {**data, "exp": expire},
        settings.SECRET_KEY,
        algorithm="HS256"
    )
```

### Input Validation
- Always use Pydantic for request bodies
- Validate path/query parameters with type hints
- Sanitize user input before database operations

## Logging

### Structured Logging
```python
import structlog

logger = structlog.get_logger()

async def create_user(data: UserCreate) -> User:
    logger.info("creating_user", email=data.email)
    try:
        user = await user_service.create(data)
        logger.info("user_created", user_id=user.id)
        return user
    except Exception as e:
        logger.error("user_creation_failed", error=str(e), email=data.email)
        raise
```

### Log Levels
- `DEBUG`: Detailed diagnostic information
- `INFO`: General operational events
- `WARNING`: Unexpected but handled situations
- `ERROR`: Failures that need attention

## Testing

### Fixtures
```python
@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_maker() as session:
        yield session

@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncClient:
    app.dependency_overrides[get_db] = lambda: db_session
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
```

### Test Structure
```python
class TestUserAPI:
    async def test_create_user_success(self, client: AsyncClient):
        response = await client.post("/api/v1/users", json={
            "email": "test@example.com",
            "password": "SecurePass123"
        })

        assert response.status_code == 201
        assert response.json()["data"]["email"] == "test@example.com"

    async def test_create_user_duplicate_email(self, client: AsyncClient, existing_user):
        response = await client.post("/api/v1/users", json={
            "email": existing_user.email,
            "password": "SecurePass123"
        })

        assert response.status_code == 400
        assert response.json()["error"]["code"] == "DUPLICATE_EMAIL"
```

## Configuration

### Settings Management
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    DEBUG: bool = False

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
```
