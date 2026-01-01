import sys
import os

# Add the project root directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from src.database.connection import db_manager
from src.database.models import User, Base

def setup_users():
    # Ensure tables exist
    db_manager.create_tables()

    with db_manager.get_session_context() as session:
        # 1. Check and create 'admin' (Mock User)
        admin_user = session.query(User).filter(User.username == 'admin').first()
        if not admin_user:
            print("Creating 'admin' user...")
            admin_user = User(
                username='admin',
                email='admin@example.com',
                hashed_password=User.hash_password('admin123'),
                full_name='Demo Admin',
                is_active=True,
                is_verified=True
            )
            session.add(admin_user)
        else:
            print("'admin' user already exists.")

        # 2. Check and create 'thdus0405' (Real User)
        real_user = session.query(User).filter(User.username == 'thdus0405').first()
        if not real_user:
            print("Creating 'thdus0405' user...")
            real_user = User(
                username='thdus0405',
                email='thdus0405@example.com', # Dummy email
                hashed_password=User.hash_password('01066043960'),
                full_name='Real User',
                is_active=True,
                is_verified=True
            )
            session.add(real_user)
        else:
            print("'thdus0405' user already exists. Updating password to ensure correctness.")
            # Verify and update password if needed
            if not real_user.verify_password('01066043960'):
                 real_user.hashed_password = User.hash_password('01066043960')

        try:
            session.commit()
            print("User setup completed successfully.")
        except Exception as e:
            session.rollback()
            print(f"Error during user setup: {e}")

if __name__ == "__main__":
    setup_users()
