import requests
import json

base_url = "http://localhost:8000"

def test():
    # 1. Register test user
    try:
        requests.post(f"{base_url}/auth/register", json={
            "username": "testuser99",
            "password": "password123",
            "display_name": "Test User",
            "role": "player"
        })
    except Exception as e:
        pass

    # 2. Login
    login_res = requests.post(f"{base_url}/auth/login", json={
        "username": "testuser99",
        "password": "password123"
    })
    
    if login_res.status_code != 200:
        print("Login failed", login_res.text)
        return
        
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Create character with full payload like frontend
    payload = {
        "name": "Test Hero",
        "level": 1,
        "race_id": 1,
        "class_id": 1,
        "subclass_id": None,
        "background_id": 1,
        "campaign_id": None,
        "stats": json.dumps({
            "STR": 15, "DEX": 14, "CON": 13, "INT": 12, "WIS": 10, "CHA": 8,
            "currHP": 11, "maxHP": 11,
            "spells": [],
            "spell_slots": {str(i): {"max": 0, "used": 0} for i in range(1, 10)},
            "skillProficiencies": ["athletics", "survival"],
            "background_skills": ["athletics", "survival"],
            "saveProficiencies": [],
            "expertise": [],
            "background_id": 1,
            "asiHistory": [],
            "hitDiceUsed": 0
        }),
        "equipment": "[]",
        "starting_equipment": "[]",
        "spell_list": "[]",
        "notes": ""
    }
    
    res = requests.post(f"{base_url}/characters", json=payload, headers=headers)
    print("Status:", res.status_code)
    print("Response:", res.text)

if __name__ == "__main__":
    test()
