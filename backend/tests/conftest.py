import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.database import Base, get_db
from backend.main import app
from backend.models import User
from backend.auth.auth_handler import get_password_hash

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Set up fixtures in pytest
## set up some test data or state that can be reusewd across multiple tests
## can be thought of as test dependencies that are available for the tests

# Fixture scopes:
## function: default, runs for each test function
## class: runs once per test class
## module: runs once per module
## session: runs once per test session

@pytest.fixture(scope="function")
def db():
    # Create the database and tables
    Base.metadata.create_all(bind=engine)
    
    # Create a new database session
    ## each test gets a fresh database
    ## ensures tests are isolated from each other
    ## tests can run in parallel
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db):
    """Creates a TestClient"""
    ## tool that simulates HTTP tequests
    ## lets you test API endpoints without running a server
    
    # Override the get_db dependency injection used in endpoints to ensure tests use the in-memory database instead of the real one
    def override_get_db():
        try:
            yield db
        finally:
            db.close()
    
    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app)

@pytest.fixture(scope="function")
def test_user(db):
    # Create a test user
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password=get_password_hash("testpass")
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture(scope="function")
def test_user_token(client, test_user): # Depends on client and test_user fixtures
    # Get token for test user
    response = client.post(
        "/auth/token",
        data={"username": "testuser", "password": "testpass"}
    )
    return response.json()["access_token"]

@pytest.fixture(scope="function")
def authorized_client(client, test_user_token):
    # Create a client with authentication
    client.headers = {
        **client.headers,
        "Authorization": f"Bearer {test_user_token}"
    }
    return client 