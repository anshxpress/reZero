import requests

BASE_URL = "http://localhost:5000/api"  # Adjust as needed

def get(endpoint, params=None, headers=None):
    url = f"{BASE_URL}/{endpoint}"
    response = requests.get(url, params=params, headers=headers)
    response.raise_for_status()
    return response.json()

def post(endpoint, data=None, json=None, headers=None):
    url = f"{BASE_URL}/{endpoint}"
    response = requests.post(url, data=data, json=json, headers=headers)
    response.raise_for_status()
    return response.json()

def put(endpoint, data=None, json=None, headers=None):
    url = f"{BASE_URL}/{endpoint}"
    response = requests.put(url, data=data, json=json, headers=headers)
    response.raise_for_status()
    return response.json()

def delete(endpoint, headers=None):
    url = f"{BASE_URL}/{endpoint}"
    response = requests.delete(url, headers=headers)
    response.raise_for_status()
    return response.json()
