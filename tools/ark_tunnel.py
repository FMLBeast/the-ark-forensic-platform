#!/usr/bin/env python3
"""
The Ark Forensic Platform - SSH Tunnel Manager
Creates secure tunnels to access your Vast.ai deployment locally.
"""

import subprocess
import time
import threading
import signal
import sys
import os
from pathlib import Path

class ArkTunnel:
    def __init__(self):
        self.tunnels = []
        self.processes = []
        self.running = False
        
        # Vast.ai instance configuration
        self.host = "153.204.80.81"
        self.ssh_port = "51414"  # Your Vast.ai SSH port
        self.user = "root"
        
        # Service mappings (local_port -> remote_port)
        self.services = {
            8080: {"remote": 8080, "name": "Frontend (The Ark UI)", "url": "http://localhost:8080"},
            8001: {"remote": 8001, "name": "Backend API", "url": "http://localhost:8001"},
            8434: {"remote": 8434, "name": "Ollama AI API", "url": "http://localhost:8434/api/tags"},
        }
        
    def check_ssh_key(self):
        """Check if SSH key exists or connection works"""
        try:
            result = subprocess.run([
                "ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=5",
                "-p", self.ssh_port, f"{self.user}@{self.host}", "echo 'Connected'"
            ], capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                return True
            else:
                print("❌ SSH connection failed. You may need to:")
                print(f"   1. Add your SSH key to the Vast.ai instance")
                print(f"   2. Or use password authentication")
                print(f"   3. Verify the SSH port ({self.ssh_port}) is correct")
                return False
        except Exception as e:
            print(f"❌ SSH check failed: {e}")
            return False

    def create_tunnel(self, local_port, remote_port, service_name):
        """Create a single SSH tunnel"""
        try:
            cmd = [
                "ssh", "-N", "-L", f"{local_port}:localhost:{remote_port}",
                "-p", self.ssh_port, f"{self.user}@{self.host}",
                "-o", "ServerAliveInterval=30",
                "-o", "ServerAliveCountMax=3",
                "-o", "ExitOnForwardFailure=yes"
            ]
            
            print(f"🔗 Creating tunnel for {service_name}: localhost:{local_port} -> {self.host}:{remote_port}")
            
            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            self.processes.append(process)
            
            # Wait a moment to check if tunnel started successfully
            time.sleep(2)
            if process.poll() is None:
                print(f"✅ {service_name} tunnel active on port {local_port}")
                return True
            else:
                stdout, stderr = process.communicate()
                print(f"❌ Failed to create tunnel for {service_name}: {stderr.decode()}")
                return False
                
        except Exception as e:
            print(f"❌ Error creating tunnel for {service_name}: {e}")
            return False

    def start_tunnels(self):
        """Start all SSH tunnels"""
        print("🚀 Starting The Ark Forensic Platform SSH Tunnels")
        print("=" * 60)
        print(f"📡 Connecting to Vast.ai instance: {self.host}:{self.ssh_port}")
        print()
        
        if not self.check_ssh_key():
            print("\n💡 To fix SSH access:")
            print(f"   ssh-copy-id -p {self.ssh_port} {self.user}@{self.host}")
            print("   Or manually add your public key to ~/.ssh/authorized_keys")
            return False
        
        print("✅ SSH connection verified\n")
        
        self.running = True
        success_count = 0
        
        for local_port, config in self.services.items():
            if self.create_tunnel(local_port, config["remote"], config["name"]):
                success_count += 1
        
        if success_count > 0:
            print()
            print("🎉 Tunnels Active! Access your services:")
            print("=" * 50)
            for local_port, config in self.services.items():
                if any(p.poll() is None for p in self.processes):
                    print(f"🌐 {config['name']}: {config['url']}")
            
            print()
            print("📊 Service Status:")
            print("   - Frontend: The Ark forensic investigation interface")
            print("   - Backend: REST API for database and analysis")
            print("   - Ollama: AI models for enhanced forensic analysis")
            print()
            print("💡 Press Ctrl+C to stop all tunnels")
            print("=" * 50)
            return True
        else:
            print("❌ No tunnels could be established")
            return False

    def monitor_tunnels(self):
        """Monitor tunnel health and restart if needed"""
        while self.running:
            try:
                # Check if any processes have died
                for i, process in enumerate(self.processes):
                    if process.poll() is not None:
                        local_port = list(self.services.keys())[i]
                        service_name = self.services[local_port]["name"]
                        print(f"⚠️  Tunnel for {service_name} died, restarting...")
                        
                        # Remove dead process
                        self.processes.remove(process)
                        
                        # Recreate tunnel
                        self.create_tunnel(local_port, self.services[local_port]["remote"], service_name)
                
                time.sleep(10)  # Check every 10 seconds
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"❌ Monitor error: {e}")
                time.sleep(5)

    def stop_tunnels(self):
        """Stop all SSH tunnels"""
        print("\n🛑 Stopping tunnels...")
        self.running = False
        
        for process in self.processes:
            try:
                process.terminate()
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
            except Exception as e:
                print(f"Error stopping process: {e}")
        
        self.processes.clear()
        print("✅ All tunnels stopped")

    def test_services(self):
        """Test if services are accessible through tunnels"""
        print("🔍 Testing service accessibility...")
        
        import urllib.request
        import json
        
        for local_port, config in self.services.items():
            try:
                if local_port == 8434:  # Ollama API
                    url = f"http://localhost:{local_port}/api/tags"
                elif local_port == 8001:  # Backend API
                    url = f"http://localhost:{local_port}/health"
                else:  # Frontend
                    url = f"http://localhost:{local_port}"
                
                response = urllib.request.urlopen(url, timeout=5)
                if response.getcode() == 200:
                    print(f"✅ {config['name']}: OK")
                    
                    # Show additional info for API endpoints
                    if local_port == 8434:
                        data = json.loads(response.read())
                        model_count = len(data.get('models', []))
                        print(f"   🤖 {model_count} AI models loaded")
                    elif local_port == 8001:
                        data = json.loads(response.read())
                        print(f"   💾 Database: {data.get('database', 'unknown')}")
                else:
                    print(f"❌ {config['name']}: HTTP {response.getcode()}")
                    
            except Exception as e:
                print(f"❌ {config['name']}: {e}")

    def signal_handler(self, signum, frame):
        """Handle Ctrl+C gracefully"""
        print("\n🛑 Received interrupt signal...")
        self.stop_tunnels()
        sys.exit(0)

def main():
    tunnel_manager = ArkTunnel()
    
    # Handle Ctrl+C
    signal.signal(signal.SIGINT, tunnel_manager.signal_handler)
    
    try:
        if tunnel_manager.start_tunnels():
            # Start monitoring in background
            monitor_thread = threading.Thread(target=tunnel_manager.monitor_tunnels, daemon=True)
            monitor_thread.start()
            
            # Wait a moment for tunnels to establish
            time.sleep(3)
            
            # Test services
            tunnel_manager.test_services()
            
            print("\n🔄 Monitoring tunnels... (Ctrl+C to stop)")
            
            # Keep main thread alive
            try:
                while tunnel_manager.running:
                    time.sleep(1)
            except KeyboardInterrupt:
                pass
        
    except Exception as e:
        print(f"❌ Fatal error: {e}")
    finally:
        tunnel_manager.stop_tunnels()

if __name__ == "__main__":
    main()