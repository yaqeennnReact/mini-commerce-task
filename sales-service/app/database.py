from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
#import os

#DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sales.db")
#ECHO_SQL = os.getenv("DATABASE_ECHO", "0") == "1"
#
#engine_kwargs = {"echo": ECHO_SQL}
#
#if DATABASE_URL.startswith("sqlite"):
#        engine_kwargs["connect_args"] = {"check_same_thread": False}
#
#engine = create_engine(DATABASE_URL, **engine_kwargs)
#if i want to use SQLLite insted to DB server
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:SimplePassword123!@localhost:3306/mini_commerce_sales"

engine = create_engine(SQLALCHEMY_DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
