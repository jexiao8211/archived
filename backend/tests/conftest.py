import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.database import Base, get_db
from backend.main import app
from backend.models import User, Collection, Item, ItemImage, Tag
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
## pytest looks at parameters in each test function's signature, then searches for fixtures that
## have the same names as those parameters. If they are found, the fixtures are run, and if
## something is returned, it passes those objects into the test function as arguments.
## note: fixtures can request other fixtures

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
        yield db  # Don't close the session after each request
    
    # Store original dependencies
    original_dependencies = app.dependency_overrides.copy()
    
    # Override the database dependency
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    # Restore original dependencies
    app.dependency_overrides.clear()
    app.dependency_overrides.update(original_dependencies)

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
def test_user_token(client, test_user):
    # Get token for test user
    response = client.post(
        "/auth/token",
        data={"username": "testuser", "password": "testpass"}
    )
    assert response.status_code == 200
    return response.json()["access_token"]

@pytest.fixture(scope="function")
def authorized_client(client, test_user_token):
    # Create a client with authentication
    client.headers = {
        **client.headers,
        "Authorization": f"Bearer {test_user_token}"
    }
    return client 

@pytest.fixture(scope="function")
def test_collection(db, test_user):
    collection = Collection(
        name='testcollection',
        description='a test collection for the testuser',
        owner_id=test_user.id
    )
    db.add(collection)
    db.commit()
    db.refresh(collection)

    for i, item_name in enumerate(['item1', 'item2', 'item3']):
        item = Item(
            name=item_name,
            description='test description',
            collection_id=collection.id,
            images=[ItemImage(image_url=f'testurl{i+1}') for _ in range(3)],
            tags=[Tag(name=f'tag{i+1}_{j}') for j in range(3)]  # Make tag names unique
        )
        db.add(item)
        db.commit()
        db.refresh(item)

    return collection

@pytest.fixture(scope="function")
def other_user(db):
    # Create another test user
    user = User(
        username="otheruser",
        email="other@example.com",
        hashed_password=get_password_hash("otherpass")
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture(scope="function")
def other_user_collection(db, other_user):
    collection = Collection(
        name='othercollection',
        description='a test collection for the other user',
        owner_id=other_user.id
    )
    db.add(collection)
    db.commit()
    db.refresh(collection)

    for i, item_name in enumerate(['otheritem1', 'otheritem2', 'otheritem3']):
        item = Item(
            name=item_name,
            description='other test description',
            collection_id=collection.id,
            images=[ItemImage(image_url=f'otherurl{i+1}') for _ in range(3)],
            tags=[Tag(name=f'othertag{i+1}_{j}') for j in range(3)]  # Make tag names unique
        )
        db.add(item)
        db.commit()
        db.refresh(item)

    return collection

@pytest.fixture(scope="function")
def test_item(db, test_collection):
    """Create a test item for the test user."""
    item = Item(
        name='testitem',
        description='a test item',
        collection_id=test_collection.id,
        images=[ItemImage(image_url=f'testurl{i+1}') for i in range(3)],
        tags=[Tag(name=f'tag{i+1}') for i in range(3)]
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@pytest.fixture(scope="function")
def other_user_item(db, other_user_collection):
    """Create a test item for the other user."""
    item = Item(
        name='otheritem',
        description='an item for the other user',
        collection_id=other_user_collection.id,
        images=[ItemImage(image_url=f'otherurl{i+1}') for i in range(3)],
        tags=[Tag(name=f'othertag{i+1}') for i in range(3)]
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item