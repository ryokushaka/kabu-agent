import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database.connection import db_manager
from src.database.models import User, UserApiToken
from datetime import datetime

def init_token_db():
    print("Initializing Token DB...")
    
    with db_manager.get_session_context() as session:
        # 1. Get Admin User
        admin = session.query(User).filter(User.username == 'admin').first()
        if not admin:
            print("Admin user not found! Creating...")
            # Create admin if not exists (simplified)
            admin = User(username='admin', email='admin@kabu.com', hashed_password='...')
            session.add(admin)
            session.commit()
            session.refresh(admin)
            
        # 2. Check Token Entry
        token_entry = session.query(UserApiToken).filter(
            UserApiToken.user_id == admin.id,
            UserApiToken.service == 'KIS'
        ).first()
        
        if not token_entry:
            print("Creating UserApiToken entry...")
            token_entry = UserApiToken(
                user_id=admin.id,
                service='KIS',
                kis_app_key=os.getenv('KIS_APP_KEY'),
                kis_app_secret=os.getenv('KIS_APP_SECRET'),
                kis_account_number=os.getenv('KIS_ACCOUNT_NUMBER'),
                access_token="INIT",
                token_type="Bearer",
                expires_at=datetime.now()
            )
            session.add(token_entry)
            session.commit()
            print("UserApiToken entry created!")
        else:
            print("UserApiToken entry already exists.")
            # Update credentials just in case
            token_entry.kis_app_key = os.getenv('KIS_APP_KEY')
            token_entry.kis_app_secret = os.getenv('KIS_APP_SECRET')
            token_entry.kis_account_number = os.getenv('KIS_ACCOUNT_NUMBER')
            session.commit()
            print("Credentials updated.")

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    init_token_db()
