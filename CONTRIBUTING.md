# Contributing to The Ark

Thank you for your interest in contributing to The Ark! This document provides guidelines and information for contributors.

## Code of Conduct

By participating in this project, you agree to abide by our code of conduct. Be respectful, inclusive, and professional in all interactions.

## Security Notice

**⚠️ IMPORTANT: This is a defensive security tool for forensic investigation purposes only.**

- Do not contribute code that could be used maliciously
- Only defensive security features and analysis capabilities are accepted
- All contributions must support legitimate forensic investigation workflows

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Create a feature branch** from `main`
4. **Make your changes** following our guidelines
5. **Test thoroughly** before submitting
6. **Submit a pull request** with a clear description

## Development Setup

```bash
# Clone the repository
git clone https://github.com/FMLBeast/the-ark-forensic-platform.git
cd the-ark-forensic-platform

# Install dependencies
npm install
cd backend && npm install && cd ..

# Start development environment
./start-ark.sh
```

## Project Structure

```
the-ark-forensic-platform/
├── src/                    # Frontend React application
├── backend/               # Node.js/Express API server
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Express middleware
│   │   └── database/     # Database setup
├── deployment/           # Deployment configurations
└── scripts/             # Utility scripts
```

## Contributing Guidelines

### Code Style

- **Frontend**: Follow TypeScript best practices, use functional components
- **Backend**: Use ES modules, follow Node.js conventions
- **Formatting**: Use consistent indentation (2 spaces)
- **Naming**: Use descriptive names for variables and functions

### Commit Messages

Use conventional commit format:
```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
- `feat(agents): add new cryptography analysis agent`
- `fix(auth): resolve JWT token expiration issue`
- `docs(readme): update installation instructions`

### Testing

- **Frontend**: Write unit tests for components and utilities
- **Backend**: Write tests for API endpoints and services
- **Integration**: Test full workflows end-to-end

### Security Considerations

1. **Input Validation**: Always validate and sanitize user inputs
2. **Authentication**: Ensure proper authentication for sensitive operations
3. **File Handling**: Validate file types and sizes
4. **Database**: Use parameterized queries to prevent injection
5. **API Security**: Implement rate limiting and proper error handling

## Agent Development

When contributing new analysis agents:

1. **Inherit from BaseAgent**: Use the provided base class
2. **Error Handling**: Implement robust error handling
3. **Documentation**: Document capabilities and limitations
4. **Testing**: Include sample files for testing
5. **Performance**: Consider timeout and resource usage

Example agent structure:
```javascript
class MyAgent extends BaseAgent {
  constructor() {
    super('my_agent');
    this.capabilities = ['analysis_type'];
  }

  async analyze(filePath, context) {
    // Implementation
  }
}
```

## Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new functionality
3. **Ensure CI passes** all checks
4. **Request review** from maintainers
5. **Address feedback** promptly

### PR Checklist

- [ ] Code follows project conventions
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] Security implications considered
- [ ] Performance impact assessed
- [ ] Breaking changes documented

## Types of Contributions

### Welcome Contributions

- 🐛 **Bug fixes**
- ✨ **New forensic analysis agents**
- 📚 **Documentation improvements**
- 🔧 **Performance optimizations**
- 🎨 **UI/UX enhancements**
- 🧪 **Test coverage improvements**

### Areas Needing Help

- Additional steganography detection methods
- More cryptographic analysis techniques
- Better file format support
- Performance optimizations
- Mobile-responsive design improvements
- API documentation
- Tutorial content

## Forensic Tool Integration

When adding support for new forensic tools:

1. **Check licensing** compatibility
2. **Add installation** instructions
3. **Handle missing tools** gracefully
4. **Document dependencies** clearly
5. **Provide alternatives** when possible

## Questions?

- 💬 **Discussions**: Use GitHub Discussions for questions
- 🐛 **Issues**: Report bugs via GitHub Issues
- 📧 **Contact**: Reach out to maintainers for sensitive matters

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- GitHub contributors page

Thank you for helping make The Ark better! 🚀