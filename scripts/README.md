# Production Cleanup Guide

This guide explains how to clean up the siloq-api and siloq-wordpress projects for production deployment.

## Overview

The cleanup process removes development-specific files, documentation, and temporary files while preserving essential functionality for production.

## Scripts Available

### 1. Basic Cleanup

```bash
npm run cleanup-production
```

Removes:

- Development files (.git, .github, venv)
- Test files (pytest.ini, test_settings.py)
- Development documentation
- Development scripts (setup.sh, runserver\_\*.py)
- Database files (db.sqlite3)
- Temporary files

### 2. Final Cleanup

```bash
npm run final-cleanup
```

Removes:

- Python cache files (**pycache**, \*.pyc)
- Test coverage files (.coverage, htmlcov)
- Log files (\*.log)
- Temporary editor files (_.swp, _~)
- System files (.DS_Store, Thumbs.db)
- Checks WordPress plugin for debug code

## Files Removed

### siloq-api

**Development Files Removed:**

- `.git/` - Git repository
- `.github/` - GitHub workflows
- `venv/` - Python virtual environment
- `db.sqlite3` - Development database
- `pytest.ini` - Test configuration
- `test_settings.py` - Test settings
- `setup.sh` / `setup.bat` - Development setup scripts
- `runserver_https.py` / `runserver_ssl.py` - Development server scripts

**Documentation Removed:**

- `CONTENT_HUB_COMPLETE.md` - Feature documentation
- `SUMMARY.md` - Project summary
- `WORDPRESS_INTEGRATION.md` - Integration documentation

**Files Preserved:**

- `manage.py` — Django management
- `requirements.txt` — Dependencies
- `siloq_backend/` — Django project settings package
- Application packages: `accounts/`, `billing/`, `integrations/`, `seo/`, `sites/`
- `README.md`, `DEPLOYMENT_DIGITALOCEAN.md` — Documentation
- `Procfile`, `runtime.txt` — Platform metadata
- `.env.example` — Environment template (when tracked in your clone)

### siloq-wordpress

**Development Files Removed:**

- `.git/` - Git repository
- `.github/` - GitHub workflows
- `.DS_Store` - macOS system file
- `SECURITY_AUDIT.md` - Security documentation

**Files Preserved:**

- `README.md` - Essential documentation
- `CLAUDE.md` - Maintainer / engineering standards (this cleanup script does not remove it)
- `.gitignore` - Git ignore rules
- `siloq-connector/` - WordPress plugin

## Before Deployment

After running cleanup, ensure:

1. **Environment Variables**: Set up production environment variables
2. **Database**: Configure production database settings
3. **Security**: Review and update security configurations
4. **Dependencies**: Verify all production dependencies are included

## Usage

Edit `scripts/cleanup-production.sh` and set the `cd` paths at the top of each section to your local clones of **siloq-api** and **siloq-wordpress** (the defaults are placeholders).

```bash
# Run both cleanup scripts
npm run cleanup-production
npm run final-cleanup

# Check the results (use your configured paths)
ls -la /path/to/siloq-api
ls -la /path/to/siloq-wordpress
```

## Safety

The scripts are designed to be safe:

- Only remove known development files
- Preserve all essential functionality
- Check for file existence before removal
- Provide detailed logging of actions

## Recovery

If you need to restore files:

- Use git to restore from repository
- Re-run setup scripts if needed
- Restore database from backup

## Production Deployment

After cleanup, both projects are ready for:

- Docker containerization
- Cloud deployment (Heroku, DigitalOcean, AWS)
- Traditional server deployment
