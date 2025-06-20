from sqlalchemy import create_engine
from backend.models import Base
from backend.database import DATABASE_URL

def reset_database():
    """Drop all tables and recreate them based on current models."""
    engine = create_engine(DATABASE_URL)
    
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    
    print("Database reset complete!")

if __name__ == "__main__":
    reset_database() 