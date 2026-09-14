import json
import sys

try:
    with open('public/data/india-rivers-highres.geojson', 'r') as f:
        data = json.load(f)
        
    initial_count = len(data['features'])
    data['features'] = [f for f in data['features'] if f.get('properties', {}).get('name') != 'Ganges']
    final_count = len(data['features'])
    
    print(f"Removed {initial_count - final_count} features named 'Ganges'")
    
    with open('public/data/india-rivers-highres.geojson', 'w') as f:
        json.dump(data, f)
        
except Exception as e:
    print(e)
