from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker
from backend.models import Base

DATABASE_URL = "postgresql://postgres:testpass123@localhost:5433/Test"  # You can use any database here

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
metadata = MetaData()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

Base.metadata.create_all(bind=engine)