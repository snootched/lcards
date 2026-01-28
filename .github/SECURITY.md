# Security Policy

## Supported Versions

LCARdS is actively maintained as a hobby project. Security updates are provided for:

| Version | Supported          |
| ------- | ------------------ |
| Latest release | :white_check_mark: |
| Main branch (development) | :white_check_mark: |
| Older releases | :x: |

**Note:** As a hobby project, we recommend always using the latest release from HACS or GitHub releases.

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability in LCARdS, please report it privately:

### Preferred Method: GitHub Security Advisories

1. Go to [https://github.com/snootched/LCARdS/security/advisories/new](https://github.com/snootched/LCARdS/security/advisories/new)
2. Fill out the security advisory form
3. Provide as much detail as possible

### Alternative: Email

If you prefer email or cannot use GitHub Security Advisories:

1. Email the maintainer (find contact info in package.json or profile)
2. Include "[LCARdS Security]" in the subject line
3. Provide detailed information about the vulnerability

### What to Include

Please include the following information in your report:

- **Description:** Clear description of the vulnerability
- **Impact:** What can an attacker do? What data is at risk?
- **Reproduction:** Step-by-step instructions to reproduce
- **LCARdS Version:** Which version(s) are affected?
- **Home Assistant Version:** If relevant
- **Suggested Fix:** If you have ideas for a fix (optional)
- **Proof of Concept:** Code or config demonstrating the issue (if applicable)

### What to Expect

This is a hobby project with limited resources, but we take security seriously:

1. **Acknowledgment:** We'll acknowledge your report within **7 days**
2. **Investigation:** We'll investigate and provide an initial assessment within **14 days**
3. **Fix Timeline:** 
   - Critical vulnerabilities: Aim for fix within **30 days**
   - High severity: Aim for fix within **60 days**
   - Medium/Low severity: Best effort basis
4. **Disclosure:** We'll coordinate disclosure timing with you
5. **Credit:** We'll credit you in the security advisory (if you wish)

**Please Note:** As a hobby project maintained in spare time, these timelines are goals, not guarantees. We appreciate your patience and understanding.

## Security Best Practices for Users

When using LCARdS, follow these security best practices:

### 1. Keep Updated
- Use the latest release from HACS or GitHub
- Subscribe to release notifications
- Review CHANGELOG for security fixes

### 2. Configuration Security
- **Never** commit Home Assistant configs with tokens/passwords to public repos
- Remove sensitive data before sharing configs in issues
- Use Home Assistant's secrets.yaml for sensitive values
- Be careful with JavaScript templates that execute code

### 3. Custom Packs (When Available)
- Only use packs from trusted sources
- Review pack code before installing
- Report suspicious packs immediately

### 4. Browser Security
- Keep your browser updated
- Use HTTPS for Home Assistant access
- Don't use LCARdS on untrusted networks without VPN

### 5. Home Assistant Security
- Follow [Home Assistant security best practices](https://www.home-assistant.io/docs/configuration/securing/)
- Use strong passwords/authentication
- Limit network exposure
- Regular backups

## Scope

### In Scope

Security issues in:
- LCARdS core code (src/)
- Built-in cards and components
- Editor/Studio code
- Template evaluation
- Data handling
- XSS vulnerabilities
- Code injection vulnerabilities
- Authentication/authorization bypasses (if applicable)

### Out of Scope

The following are **not** considered security vulnerabilities:

- Issues in Home Assistant itself (report to Home Assistant project)
- Issues in dependencies (unless LCARdS uses them insecurely)
- Vulnerabilities requiring physical access to the device
- Social engineering attacks
- Browser vulnerabilities (unless LCARdS misuses browser APIs)
- Intentional misuse of JavaScript templates (user executes malicious code)
- Issues in user-created custom packs (report to pack author)

## Known Security Considerations

### JavaScript Template Execution

LCARdS supports JavaScript templates that execute in the browser:

```yaml
text: '[[[return entity.state.toUpperCase()]]]'
```

**Security Note:** These templates execute with full JavaScript access. Only use templates from trusted sources. Never use untrusted user input in JavaScript templates without sanitization.

### Jinja2 Template Evaluation

LCARdS evaluates Jinja2 templates via Home Assistant:

```yaml
text: '{{states("sensor.temperature")}}'
```

**Security Note:** These are evaluated by Home Assistant backend and inherit HA's security model. Still, avoid using untrusted input.

### Browser Storage

LCARdS may store configuration and state in browser localStorage/sessionStorage. This data is accessible to JavaScript on the same origin.

## Disclosure Policy

- **Private Disclosure:** Security issues are handled privately until fixed
- **Coordinated Disclosure:** We coordinate disclosure timing with reporters
- **Security Advisories:** Published via GitHub Security Advisories
- **Changelog:** Security fixes noted in CHANGELOG.md
- **Release Notes:** Critical security fixes highlighted in releases

## Questions?

Have questions about LCARdS security? 

- For general questions: Use [Discussions](https://github.com/snootched/LCARdS/discussions)
- For security-specific questions: Create a private security advisory

---

**Remember:** This is a hobby project for personal use. While we take security seriously, use LCARdS responsibly and at your own risk. See [LICENSE](../LICENSE) for full terms.

🖖 **Stay secure, and live long and prosper!**
