# Testing Guide for Archived Project

This guide provides comprehensive documentation for testing both the backend and frontend of the Archived project.

## Table of Contents
- [Backend Testing](#backend-testing)
- [Frontend Testing](#frontend-testing)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Backend Testing

### Framework
- **pytest**: Primary testing framework
- **FastAPI TestClient**: For API endpoint testing
- **SQLAlchemy**: In-memory database for isolated tests

### Test Structure
```
backend/tests/
├── conftest.py          # Test fixtures and configuration
├── test_auth.py         # Authentication tests
├── test_collections.py  # Collection management tests
├── test_contact.py      # Contact form tests
├── test_images.py       # Image handling tests
├── test_items.py        # Item management tests
├── test_share.py        # Share functionality tests
└── test_users.py        # User management tests
```

### Key Features
- **Isolated Tests**: Each test runs with a fresh in-memory database
- **Fixtures**: Reusable test data (users, collections, items)
- **Authentication**: Tests for both authenticated and unauthenticated scenarios
- **Error Handling**: Comprehensive error case testing

### Test Categories

#### 1. Authentication Tests (`test_auth.py`)
- User registration (success, duplicate username/email)
- User login (success, wrong password, non-existent user)
- Username updates and account deletion
- Password validation

#### 2. Collection Tests (`test_collections.py`)
- CRUD operations for collections
- Collection ordering and reordering
- Item management within collections
- Authorization (users can only access their own collections)

#### 3. Item Tests (`test_items.py`)
- CRUD operations for items
- Tag management (add, remove, get)
- Image management (upload, delete, reorder)
- Item ordering within collections

#### 4. Share Tests (`test_share.py`)
- Creating and enabling share links
- Token rotation and disabling
- Public access to shared collections and items
- Authorization for share management

#### 5. Contact Tests (`test_contact.py`)
- Contact form submission
- Rate limiting functionality
- Form validation

### Running Backend Tests

```bash
# Run all tests
poetry run pytest

# Run specific test file
poetry run pytest backend/tests/test_auth.py

# Run with coverage
poetry run pytest --cov=backend

# Run with verbose output
poetry run pytest -v

# Run specific test
poetry run pytest backend/tests/test_auth.py::test_register_user
```

## Frontend Testing

### Framework
- **Vitest**: Fast, modern testing framework
- **React Testing Library**: Component testing utilities
- **@testing-library/user-event**: User interaction simulation
- **jsdom**: DOM environment for tests

### Test Structure
```
frontend/src/
├── test/
│   ├── setup.ts         # Test configuration and mocks
│   └── test-utils.tsx   # Custom render function with providers
└── components/__tests__/
    ├── LoginForm.test.tsx
    ├── RegisterForm.test.tsx
    ├── NavBar.test.tsx
    ├── ContactForm.test.tsx
    └── AuthContext.test.tsx
```

### Key Features
- **Component Isolation**: Each component tested in isolation
- **Provider Wrapping**: Tests include necessary React context providers
- **API Mocking**: All API calls are mocked for reliable testing
- **User Interactions**: Realistic user interaction simulation

### Test Categories

#### 1. Authentication Components
- **LoginForm**: Form validation, submission, error handling
- **RegisterForm**: Password matching, validation, submission
- **AuthContext**: Login/logout flows, token management

#### 2. Navigation Components
- **NavBar**: Link rendering, active state management

#### 3. Form Components
- **ContactForm**: Form submission, validation, rate limiting

### Running Frontend Tests

```bash
# Run all tests
cd frontend
npm test

# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage
```

## Test Structure

### Backend Test Pattern
```python
def test_endpoint_success(client, fixture):
    """Test successful endpoint operation."""
    response = client.get("/endpoint")
    assert response.status_code == 200
    data = response.json()
    assert data["expected_field"] == "expected_value"

def test_endpoint_unauthorized(client):
    """Test endpoint without authentication."""
    response = client.get("/endpoint")
    assert response.status_code == 401

def test_endpoint_not_found(client):
    """Test endpoint with non-existent resource."""
    response = client.get("/endpoint/99999")
    assert response.status_code == 404
```

### Frontend Test Pattern
```typescript
describe('ComponentName', () => {
  it('renders component with required elements', () => {
    render(<ComponentName />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })

  it('handles user interactions correctly', async () => {
    const user = userEvent.setup()
    render(<ComponentName />)
    
    await user.click(screen.getByRole('button'))
    expect(mockFunction).toHaveBeenCalled()
  })
})
```

## Best Practices

### Backend Testing
1. **Use Fixtures**: Leverage pytest fixtures for consistent test data
2. **Test Edge Cases**: Include tests for error conditions and edge cases
3. **Isolation**: Each test should be independent and not rely on others
4. **Descriptive Names**: Use clear, descriptive test function names
5. **Assertions**: Use specific assertions rather than generic ones

### Frontend Testing
1. **User-Centric**: Test from the user's perspective, not implementation details
2. **Mock External Dependencies**: Mock API calls and external services
3. **Accessibility**: Test for accessibility features when relevant
4. **Error States**: Test error handling and loading states
5. **Form Validation**: Test both valid and invalid form submissions

### General
1. **AAA Pattern**: Arrange, Act, Assert structure
2. **Single Responsibility**: Each test should test one specific behavior
3. **Clear Documentation**: Use descriptive test names and comments
4. **Maintainability**: Keep tests simple and easy to understand

## Troubleshooting

### Common Backend Issues
- **Database Conflicts**: Ensure tests use isolated databases
- **Authentication**: Check that test users are properly created
- **Fixtures**: Verify fixture dependencies are correct

### Common Frontend Issues
- **Provider Missing**: Ensure all necessary providers are included in test wrapper
- **Async Operations**: Use `waitFor` for async operations
- **Mocking**: Verify API mocks are properly configured

### Debug Commands
```bash
# Backend debugging
pytest -v -s  # Verbose output with print statements
pytest --pdb  # Drop into debugger on failure

# Frontend debugging
npm test -- --reporter=verbose
npm test -- --run --reporter=verbose
```

## Coverage Goals

### Backend
- **Target**: 90%+ code coverage
- **Critical Areas**: Authentication, data validation, error handling
- **Focus**: API endpoints, business logic, security features

### Frontend
- **Target**: 80%+ component coverage
- **Critical Areas**: User interactions, form validation, error handling
- **Focus**: User flows, component behavior, accessibility

## Continuous Integration

### Recommended CI Setup
```yaml
# Example GitHub Actions workflow
name: Tests
on: [push, pull_request]
jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.12
      - name: Install dependencies
        run: cd backend && pip install -r requirements.txt
      - name: Run tests
        run: cd backend && pytest --cov=backend

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: 18
      - name: Install dependencies
        run: cd frontend && npm install
      - name: Run tests
        run: cd frontend && npm run test:run
```

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Maintain or improve coverage
4. Update this documentation if needed

## Resources

- [pytest Documentation](https://docs.pytest.org/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest Documentation](https://vitest.dev/)
