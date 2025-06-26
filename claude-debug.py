#!/usr/bin/env python3
import os
import sys

try:
    import anthropic
except ImportError:
    print("Installing anthropic...")
    os.system("pip3 install anthropic --break-system-packages")
    import anthropic

def test_connection():
    api_key = os.getenv('ANTHROPIC_API_KEY')
    if not api_key:
        print("❌ No API key found")
        return False
    
    print(f"🔑 API Key: {api_key[:20]}...{api_key[-10:]}")
    
    try:
        client = anthropic.Anthropic(api_key=api_key)
        print("✅ Client created successfully")
        
        # Test with a simple message
        print("🧪 Testing API call...")
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=50,
            messages=[{"role": "user", "content": "Say 'Hello' briefly"}]
        )
        print(f"✅ Success: {response.content[0].text}")
        return True
        
    except Exception as e:
        print(f"❌ Error details: {type(e).__name__}: {str(e)}")
        
        # Try with older model
        try:
            print("🔄 Trying with claude-3-haiku...")
            response = client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=50,
                messages=[{"role": "user", "content": "Say 'Hello' briefly"}]
            )
            print(f"✅ Haiku works: {response.content[0].text}")
            return True
        except Exception as e2:
            print(f"❌ Haiku also failed: {type(e2).__name__}: {str(e2)}")
        
        return False

if __name__ == "__main__":
    print("🔍 Claude Connection Debug")
    print("=" * 30)
    test_connection()