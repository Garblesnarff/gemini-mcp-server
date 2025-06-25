# Security Policy

## Supported Versions

We actively maintain security for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | :white_check_mark: |
| < 2.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it privately by:

1. **DO NOT** create a public GitHub issue
2. Email the maintainers or create a private security advisory
3. Include detailed information about the vulnerability
4. Provide steps to reproduce if possible

## Security Best Practices

When using this MCP server:

1. **Never commit your `.env` file** - It contains your API keys
2. **Secure your Gemini API key** - Treat it like a password
3. **Limit API key permissions** if possible in Google AI Studio
4. **Regularly rotate your API keys**
5. **Monitor your API usage** for unexpected activity
6. **Run the server in a secure environment**

## Known Security Considerations

- The server processes user-provided file paths - ensure you trust input sources
- Generated images and files are saved to the configured output directory
- Tool Intelligence system learns from interactions but stores no sensitive data
- Audio/video processing requires file system access for temporary files

## Updates

Security updates will be published as patch releases and documented in the changelog.