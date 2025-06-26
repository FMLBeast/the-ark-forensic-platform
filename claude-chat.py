#!/usr/bin/env python3
import os
import sys

try:
    import anthropic
except ImportError:
    print("Installing anthropic...")
    os.system("pip3 install anthropic --break-system-packages")
    import anthropic

def main():
    api_key = os.getenv('ANTHROPIC_API_KEY')
    if not api_key:
        print("🔑 Please set your API key:")
        print("export ANTHROPIC_API_KEY='your-key-here'")
        api_key = input("Enter your API key: ").strip()
        if api_key:
            os.environ['ANTHROPIC_API_KEY'] = api_key
        else:
            return
    
    client = anthropic.Anthropic(api_key=api_key)
    print("🤖 Claude Chat Ready!")
    print("Type 'exit' to quit")
    print("-" * 30)
    
    while True:
        try:
            user_input = input("\nYou: ")
            if user_input.lower() in ['exit', 'quit']:
                break
            if not user_input.strip():
                continue
                
            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1000,
                messages=[{"role": "user", "content": user_input}]
            )
            print(f"\nClaude: {response.content[0].text}")
            
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"Error: {e}")
            break
    
    print("\nGoodbye!")

if __name__ == "__main__":
    main()