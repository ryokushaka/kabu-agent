import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database.connection import db_manager
from src.database.models import User, UserApiToken
from src.kis_api import kis_client
from dotenv import load_dotenv

load_dotenv()

def check_creds():
    print("Checking KIS Credentials...")
    
    # 1. Check Env
    print(f"Env APP_KEY: {os.getenv('KIS_APP_KEY')[:5]}..." if os.getenv('KIS_APP_KEY') else "Env APP_KEY: None")
    
    # 2. Check DB
    with db_manager.get_session_context() as session:
        token_entry = session.query(UserApiToken).join(User).filter(
            User.username == 'admin',
            UserApiToken.service == 'KIS'
        ).first()
        
        if token_entry:
            print(f"DB APP_KEY: {token_entry.kis_app_key[:5]}..." if token_entry.kis_app_key else "DB APP_KEY: None")
            print(f"DB Access Token: {token_entry.access_token[:10]}..." if token_entry.access_token else "DB Access Token: None")
        else:
            print("No DB entry found for admin/KIS")
            
    # 3. Try Authentication
    print("Attempting Authentication...")
    if kis_client.authenticate():
        print("Authentication SUCCESS!")
    else:
        print("Authentication FAILED!")

if __name__ == "__main__":
    check_creds()
