# The Ark Backend

Modern forensic investigation platform backend API built with Node.js and Express.

## Features

- **Real Agent Orchestration**: Implements actual forensic analysis agents for file analysis, steganography detection, cryptography analysis, and intelligence synthesis
- **File Upload & Analysis**: Support for multiple file types with entropy calculation and metadata extraction
- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Investigation Management**: Create and manage collaborative investigations
- **Real-time Updates**: WebSocket support for live analysis progress updates
- **Database Integration**: SQLite database for persistent storage
- **Security**: CORS, rate limiting, input validation, and secure file handling

## Quick Start

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Default Login**
   - Username: `admin`
   - Password: `admin123`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/session` - Check session
- `POST /api/auth/logout` - User logout
- `POST /api/auth/register` - Register new user (admin only)

### Agents
- `GET /api/agents/list` - Get available agents
- `GET /api/agents/stats` - Get agent statistics
- `GET /api/agents/capabilities` - Get agent capabilities
- `POST /api/agents/orchestrate` - Start analysis orchestration
- `GET /api/agents/orchestration/:id` - Get orchestration status
- `POST /api/agents/:name/execute` - Execute single agent task

### Files
- `POST /api/files/upload` - Upload file for analysis
- `GET /api/files` - List uploaded files
- `GET /api/files/:id` - Get file details
- `GET /api/files/:id/download` - Download file
- `DELETE /api/files/:id` - Delete file

### Analysis
- `POST /api/analysis/start` - Start analysis session
- `GET /api/analysis/status/:id` - Get analysis status
- `GET /api/analysis/history` - Get analysis history
- `GET /api/analysis/intelligence` - Get database intelligence

### Forensics
- `GET /api/forensics/xor` - Get XOR analysis results
- `GET /api/forensics/steganography` - Get steganography results
- `GET /api/forensics/search` - Search forensic data
- `GET /api/forensics/file/:id/analysis` - Get file analysis summary

### Collaboration
- `GET /api/collaboration/investigations` - List investigations
- `POST /api/collaboration/investigations` - Create investigation
- `GET /api/collaboration/investigations/:id` - Get investigation
- `PUT /api/collaboration/investigations/:id` - Update investigation
- `POST /api/collaboration/investigations/:id/collaborators` - Add collaborator
- `POST /api/collaboration/investigations/:id/evidence` - Add evidence

### System
- `GET /api/system/status` - Get system status
- `GET /api/system/notifications` - Get notifications
- `PUT /api/system/notifications/:id/read` - Mark notification as read
- `POST /api/system/notifications` - Create notification (admin)
- `GET /api/system/metrics` - Get system metrics
- `GET /api/system/operatives` - List operatives

## Real Agent Implementation

The backend includes real forensic analysis agents:

### File Analysis Agent
- Calculates Shannon entropy
- Extracts metadata using exiftool
- Performs file type detection
- Calculates suspicion scores

### Steganography Agent
- LSB (Least Significant Bit) analysis
- Integration with zsteg and steghide
- Pattern detection in image files
- Confidence scoring

### Cryptography Agent
- XOR cipher analysis (single/multi-byte)
- Caesar cipher detection
- Base64 pattern detection
- Frequency analysis

### Intelligence Agent
- Cross-correlation of findings
- Pattern synthesis
- Recommendation generation
- Database correlation

## Security Features

- JWT authentication with secure sessions
- Role-based access control (admin, investigator)
- Rate limiting on API endpoints
- Input validation and sanitization
- Secure file upload with type validation
- CORS protection
- SQL injection prevention

## Database Schema

The backend uses SQLite with the following main tables:
- `operatives` - User accounts and roles
- `forensic_files` - Uploaded files and metadata
- `investigations` - Investigation cases
- `analysis_sessions` - Analysis execution tracking
- `analysis_results` - Agent analysis results
- `xor_results` - XOR cryptography findings
- `steganography_results` - Steganographic content
- `notifications` - System notifications

## Development

```bash
# Install dependencies
npm install

# Run in development mode with auto-reload
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Production start
npm start
```

## External Dependencies

For full functionality, install these forensic tools:

```bash
# Ubuntu/Debian
sudo apt-get install exiftool file

# Install zsteg (Ruby gem)
gem install zsteg

# Install steghide
sudo apt-get install steghide
```

## Environment Variables

See `.env.example` for all configuration options.

## WebSocket Support

Real-time updates available at `/ws` endpoint:
- Analysis progress updates
- System status changes
- Notifications
- Investigation updates

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure proper JWT/session secrets
3. Set up reverse proxy (nginx)
4. Configure HTTPS
5. Set up process manager (PM2)
6. Configure log rotation
7. Set up monitoring

## License

MIT License - See LICENSE file for details.