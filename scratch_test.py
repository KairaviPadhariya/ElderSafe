import requests
import string
import random

email = ''.join(random.choices(string.ascii_lowercase, k=10)) + "@test.com"

print(f"Registering {email}...")
res = requests.post("http://127.0.0.1:8000/users", json={
    "name": "Test User",
    "email": email,
    "password": "password123",
    "role": "patient"
})

print("Register status:", res.status_code, res.text)

print(f"Logging in {email}...")
auth = requests.post("http://127.0.0.1:8000/login", data={
    "username": email,
    "password": "password123"
})

print("Login status:", auth.status_code, auth.text)
