"""
Script para depurar la creación de personajes
"""

import requests
import json

def test_character_creation():
    """Probar la creación de personajes con diferentes escenarios"""
    
    base_url = "http://localhost:8000"
    
    # 1. Probar login
    print("🔐 Probando login...")
    login_data = {'username': 'test', 'password': 'test123'}
    
    try:
        login_response = requests.post(f"{base_url}/auth/login", json=login_data)
        print(f"Login status: {login_response.status_code}")
        
        if login_response.status_code != 200:
            print(f"Login failed: {login_response.text}")
            return
        
        token = login_response.json().get('access_token')
        headers = {'Authorization': f'Bearer {token}'}
        print("✅ Login exitoso")
        
        # 2. Probar diferentes escenarios de creación
        test_cases = [
            {
                'name': 'Test Case 1 - Minimal',
                'data': {
                    'name': 'Test Character Minimal',
                    'level': 1,
                    'race_id': None,
                    'class_id': None,
                    'subclass_id': None,
                    'background_id': None,
                    'campaign_id': None,
                    'stats': '{}',
                    'equipment': '[]',
                    'spell_list': '[]',
                    'notes': ''
                }
            },
            {
                'name': 'Test Case 2 - With Race',
                'data': {
                    'name': 'Test Character With Race',
                    'level': 1,
                    'race_id': 1,
                    'class_id': None,
                    'subclass_id': None,
                    'background_id': None,
                    'campaign_id': None,
                    'stats': '{"STR": 10, "DEX": 10, "CON": 10, "INT": 10, "WIS": 10, "CHA": 10}',
                    'equipment': '[]',
                    'spell_list': '[]',
                    'notes': ''
                }
            },
            {
                'name': 'Test Case 3 - With Class',
                'data': {
                    'name': 'Test Character With Class',
                    'level': 1,
                    'race_id': 1,
                    'class_id': 1,
                    'subclass_id': None,
                    'background_id': None,
                    'campaign_id': None,
                    'stats': '{"STR": 10, "DEX": 10, "CON": 10, "INT": 10, "WIS": 10, "CHA": 10}',
                    'equipment': '[]',
                    'spell_list': '[]',
                    'notes': ''
                }
            }
        ]
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n🧪 Test Case {i}: {test_case['name']}")
            print(f"Data: {json.dumps(test_case['data'], indent=2)}")
            
            try:
                create_response = requests.post(f"{base_url}/characters", 
                                           json=test_case['data'], 
                                           headers=headers)
                print(f"Status: {create_response.status_code}")
                
                if create_response.status_code == 200:
                    print("✅ Creación exitosa")
                    character_data = create_response.json()
                    print(f"Character ID: {character_data.get('id')}")
                else:
                    print("❌ Error en creación")
                    try:
                        error_data = create_response.json()
                        print(f"Error details: {json.dumps(error_data, indent=2)}")
                    except:
                        print(f"Error text: {create_response.text}")
                        
            except Exception as e:
                print(f"❌ Exception: {e}")
        
        # 3. Probar obtener razas y clases disponibles
        print(f"\n📋 Verificando datos disponibles...")
        
        races_response = requests.get(f"{base_url}/compendium/races", headers=headers)
        print(f"Races status: {races_response.status_code}")
        if races_response.status_code == 200:
            races = races_response.json()
            print(f"Races disponibles: {len(races)}")
            if races:
                print(f"Primera raza: {races[0].get('name')} (ID: {races[0].get('id')})")
        
        classes_response = requests.get(f"{base_url}/compendium/classes", headers=headers)
        print(f"Classes status: {classes_response.status_code}")
        if classes_response.status_code == 200:
            classes = classes_response.json()
            print(f"Classes disponibles: {len(classes)}")
            if classes:
                print(f"Primera clase: {classes[0].get('name')} (ID: {classes[0].get('id')})")
                
    except Exception as e:
        print(f"❌ Error general: {e}")

if __name__ == "__main__":
    test_character_creation()
