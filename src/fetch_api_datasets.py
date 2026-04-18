import requests
import pandas as pd
import time
import os

API_URL = "https://api.jolpi.ca/ergast/f1/results.json"
LIMIT = 1000
OUTPUT_FILE = "../f1-story/public/data/rq3_driver_transfers.csv"
OUTPUT_DIST = "../f1-story/dist/data/rq3_driver_transfers.csv"

def fetch_all_results():
    all_rows = []
    offset = 0
    total = 1000  # Will be updated on first request
    
    headers = {
        "User-Agent": "F1-Story-Viz/1.0 (Contact: local-student)"
    }
    
    print("Starting data ingestion from Jolpica API...")
    
    while offset < total:
        print(f"Fetching offset {offset}...")
        try:
            response = requests.get(f"{API_URL}?limit={LIMIT}&offset={offset}", headers=headers, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            mrdata = data.get("MRData", {})
            total = int(mrdata.get("total", 0))
            races = mrdata.get("RaceTable", {}).get("Races", [])
            
            for race in races:
                year = race.get("season")
                for result in race.get("Results", []):
                    driver_data = result.get("Driver", {})
                    driver_name = f"{driver_data.get('givenName', '')} {driver_data.get('familyName', '')}".strip()
                    
                    constructor_data = result.get("Constructor", {})
                    # Standardize some team names that Ergast returns fully
                    constructor_name = constructor_data.get("name", "")
                    
                    name = constructor_data.get("name", "")
                    name = name.replace(" Aramco Mercedes", "")
                    name = name.replace(" Honda RBPT", "")
                    name = name.replace(" Mercedes", "")
                    name = name.replace(" Ferrari", "")
                    name = name.replace(" Renault", "")
                    name = name.replace(" Racing", "")
                    if "Aston Martin" in name: constructor_name = "Aston Martin"
                    elif "Red Bull" in name: constructor_name = "Red Bull"
                    elif "McLaren" in name: constructor_name = "McLaren"
                    elif "Alpine" in name: constructor_name = "Alpine"
                    elif "Williams" in name: constructor_name = "Williams"
                    elif "Haas" in name: constructor_name = "Haas"
                    elif "AlphaTauri" in name or "RB" == name: constructor_name = "RB"
                    elif "Sauber" in name: constructor_name = "Sauber"
                    else: constructor_name = name.strip()
                    


                    position = result.get("position", "0")
                    is_win = 1 if position == "1" else 0
                    
                    all_rows.append({
                        "Driver": driver_name,
                        "Constructor": constructor_name,
                        "Year": int(year),
                        "Win": is_win
                    })
                    
            offset += LIMIT
            time.sleep(0.5)  # Respect API rate limits
            
        except Exception as e:
            print(f"Error fetching data at offset {offset}: {e}")
            break
            
    if not all_rows:
        print("Failed to fetch data.")
        return

    # Convert to DataFrame
    df = pd.DataFrame(all_rows)
    
    # We want to aggregate exactly like rq3: groupby Driver, Constructor, Year
    # Some races might happen in the same year with the same driver/constructor (which is standard)
    rq3_df = df.groupby(['Driver', 'Constructor', 'Year']).agg({'Win':'sum'}).reset_index()
    
    # Save files
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    os.makedirs(os.path.dirname(OUTPUT_DIST), exist_ok=True)
    
    rq3_df.to_csv(OUTPUT_FILE, index=False)
    rq3_df.to_csv(OUTPUT_DIST, index=False)
    
    print(f"Saved freshly built API dataset to {OUTPUT_FILE}!")
    print(f"Total driver-constructor-season rows: {len(rq3_df)}")
    
if __name__ == "__main__":
    fetch_all_results()
