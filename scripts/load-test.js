#!/usr/bin/env node

/**
 * Simple load testing script for The Ark Forensic Platform
 * Tests basic performance and responsiveness under load
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';

const config = {
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173',
    endpoints: ['/', '/dashboard', '/login']
  },
  backend: {
    url: process.env.BACKEND_URL || 'http://localhost:3001',
    endpoints: ['/health', '/api/forensic/stats']
  },
  concurrent: parseInt(process.env.CONCURRENT_REQUESTS) || 10,
  duration: parseInt(process.env.TEST_DURATION) || 30, // seconds
  timeout: parseInt(process.env.REQUEST_TIMEOUT) || 5000 // ms
};

class LoadTester {
  constructor() {
    this.results = {
      total: 0,
      success: 0,
      errors: 0,
      timeouts: 0,
      responseTimes: [],
      startTime: null,
      endTime: null
    };
  }

  async makeRequest(url) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        timeout: config.timeout,
        headers: {
          'User-Agent': 'Ark-LoadTester/1.0'
        }
      };

      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          this.results.total++;
          this.results.responseTimes.push(responseTime);
          
          if (res.statusCode >= 200 && res.statusCode < 400) {
            this.results.success++;
          } else {
            this.results.errors++;
          }
          
          resolve({
            url,
            statusCode: res.statusCode,
            responseTime,
            success: res.statusCode >= 200 && res.statusCode < 400
          });
        });
      });

      req.on('error', (error) => {
        this.results.total++;
        this.results.errors++;
        resolve({
          url,
          statusCode: 0,
          responseTime: Date.now() - startTime,
          success: false,
          error: error.message
        });
      });

      req.on('timeout', () => {
        this.results.total++;
        this.results.timeouts++;
        req.destroy();
        resolve({
          url,
          statusCode: 0,
          responseTime: config.timeout,
          success: false,
          error: 'Request timeout'
        });
      });

      req.end();
    });
  }

  async runLoadTest() {
    console.log('🚀 Starting load test...');
    console.log(`Configuration:
  - Concurrent requests: ${config.concurrent}
  - Test duration: ${config.duration}s
  - Request timeout: ${config.timeout}ms
  - Frontend: ${config.frontend.url}
  - Backend: ${config.backend.url}
`);

    this.results.startTime = Date.now();
    const endTime = this.results.startTime + (config.duration * 1000);
    
    const workers = [];
    
    // Start concurrent workers
    for (let i = 0; i < config.concurrent; i++) {
      workers.push(this.worker(endTime));
    }
    
    // Wait for all workers to complete
    await Promise.all(workers);
    
    this.results.endTime = Date.now();
    this.printResults();
    
    // Return success/failure based on results
    return this.results.success > 0 && this.results.errors < this.results.total * 0.1;
  }

  async worker(endTime) {
    const allEndpoints = [
      ...config.frontend.endpoints.map(ep => config.frontend.url + ep),
      ...config.backend.endpoints.map(ep => config.backend.url + ep)
    ];

    while (Date.now() < endTime) {
      const randomEndpoint = allEndpoints[Math.floor(Math.random() * allEndpoints.length)];
      await this.makeRequest(randomEndpoint);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  printResults() {
    const duration = (this.results.endTime - this.results.startTime) / 1000;
    const requestsPerSecond = this.results.total / duration;
    const successRate = (this.results.success / this.results.total) * 100;
    
    // Calculate response time statistics
    const responseTimes = this.results.responseTimes.sort((a, b) => a - b);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const medianResponseTime = responseTimes[Math.floor(responseTimes.length / 2)];
    const p95ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.95)];
    const maxResponseTime = Math.max(...responseTimes);

    console.log('\n📊 Load Test Results:');
    console.log('================================');
    console.log(`Duration: ${duration.toFixed(2)}s`);
    console.log(`Total requests: ${this.results.total}`);
    console.log(`Successful requests: ${this.results.success}`);
    console.log(`Failed requests: ${this.results.errors}`);
    console.log(`Timeouts: ${this.results.timeouts}`);
    console.log(`Requests/second: ${requestsPerSecond.toFixed(2)}`);
    console.log(`Success rate: ${successRate.toFixed(2)}%`);
    console.log('');
    console.log('Response Times:');
    console.log(`  Average: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`  Median: ${medianResponseTime}ms`);
    console.log(`  95th percentile: ${p95ResponseTime}ms`);
    console.log(`  Maximum: ${maxResponseTime}ms`);
    
    // Performance assessment
    console.log('\n🎯 Performance Assessment:');
    
    if (successRate < 95) {
      console.log('❌ High error rate detected');
    } else if (successRate < 99) {
      console.log('⚠️  Some errors detected');
    } else {
      console.log('✅ Excellent success rate');
    }
    
    if (avgResponseTime > 2000) {
      console.log('❌ High average response time');
    } else if (avgResponseTime > 1000) {
      console.log('⚠️  Moderate response times');
    } else {
      console.log('✅ Good response times');
    }
    
    if (p95ResponseTime > 5000) {
      console.log('❌ High 95th percentile response time');
    } else if (p95ResponseTime > 3000) {
      console.log('⚠️  Moderate 95th percentile response time');
    } else {
      console.log('✅ Good 95th percentile response time');
    }
    
    if (requestsPerSecond < 1) {
      console.log('❌ Low throughput');
    } else if (requestsPerSecond < 10) {
      console.log('⚠️  Moderate throughput');
    } else {
      console.log('✅ Good throughput');
    }
  }
}

// Health check function
async function healthCheck() {
  console.log('🔍 Running health checks...');
  
  const tester = new LoadTester();
  const frontendCheck = await tester.makeRequest(config.frontend.url);
  const backendCheck = await tester.makeRequest(config.backend.url + '/health');
  
  console.log(`Frontend (${config.frontend.url}): ${frontendCheck.success ? '✅' : '❌'} ${frontendCheck.statusCode} (${frontendCheck.responseTime}ms)`);
  console.log(`Backend (${config.backend.url}/health): ${backendCheck.success ? '✅' : '❌'} ${backendCheck.statusCode} (${backendCheck.responseTime}ms)`);
  
  return frontendCheck.success && backendCheck.success;
}

// Main execution
async function main() {
  try {
    // First run health checks
    const healthy = await healthCheck();
    
    if (!healthy) {
      console.log('❌ Health checks failed, skipping load test');
      process.exit(1);
    }
    
    console.log('✅ Health checks passed\n');
    
    // Run load test
    const tester = new LoadTester();
    const success = await tester.runLoadTest();
    
    if (success) {
      console.log('\n✅ Load test completed successfully');
      process.exit(0);
    } else {
      console.log('\n❌ Load test failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Load test error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { LoadTester, healthCheck };