#!/usr/bin/env python3
import requests
import json
import os

api_key = os.getenv('ANTHROPIC_API_KEY')
if not api_key:
    print("No API key found")
    exit(1)

headers = {
    'x-api-key': api_key,
    'content-type': 'application/json',
    'anthropic-version': '2023-06-01'
}

data = {
    'model': 'claude-3-haiku-20240307',
    'max_tokens': 50,
    'messages': [{'role': 'user', 'content': 'Say hello briefly'}]
}

print("Testing direct API call...")
response = requests.post('https://api.anthropic.com/v1/messages', 
                        headers=headers, 
                        json=data, 
                        timeout=30)

print(f"Status: {response.status_code}")
if response.status_code == 200:
    result = response.json()
    print(f"Claude: {result['content'][0]['text']}")
    print("✅ API is working!")
else:
    print(f"Error: {response.text}")