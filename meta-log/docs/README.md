# meta-log Documentation

This directory contains the documentation for meta-log, built with Jekyll and hosted on GitHub Pages.

## Viewing Documentation

The documentation is available at: https://bthornemail.github.io/meta-log/

## Local Development

To run the documentation locally:

### Prerequisites

- Ruby 2.7 or higher
- Bundler

### Setup

```bash
cd docs
bundle install
```

### Run Local Server

```bash
bundle exec jekyll serve
```

Then visit http://localhost:4000/meta-log/ in your browser.

### Build Static Site

```bash
bundle exec jekyll build
```

The built site will be in the `_site/` directory.

## Structure

```
docs/
├── _config.yml              # Jekyll configuration
├── index.md                 # Homepage
├── USER_GUIDE.md           # User guide
├── MODULES.md              # Module documentation
├── API_REFERENCE.md        # API reference
├── FEDERATION_GUIDE.md     # Federation setup guide
├── CRYPTO_GUIDE.md         # Cryptography guide
├── PROTOCOL_HANDLERS.md    # Protocol handlers
├── TEMPLATE-DISCOVERY-BRIDGE.md  # Template discovery
├── BETTER-THAN-LLM.md      # Comparison with LLMs
├── POTENTIAL-ADDITIONS.md  # Future enhancements
├── Gemfile                 # Ruby dependencies
└── README.md              # This file
```

## GitHub Pages Setup

This site is configured to be published from the `docs/` folder on the `main` branch.

To enable GitHub Pages:

1. Go to repository Settings → Pages
2. Set source to "Deploy from a branch"
3. Select branch: `main`
4. Select folder: `/docs`
5. Click Save

GitHub will automatically build and deploy the site when changes are pushed to the `docs/` folder.

## Theme

The documentation uses the Cayman theme. You can customize the theme in `_config.yml`.

Available themes:
- jekyll-theme-cayman (current)
- jekyll-theme-minimal
- jekyll-theme-slate
- just-the-docs (uncomment in _config.yml for advanced features)

## Adding New Pages

To add a new page:

1. Create a new `.md` file in the `docs/` directory
2. Add Jekyll front matter at the top:

```yaml
---
layout: default
title: Your Page Title
nav_order: 11
description: "Page description"
permalink: /your-page-name
---
```

3. Write your content in Markdown
4. The page will automatically appear in the navigation

## Editing Pages

All pages use standard Markdown syntax. The front matter controls metadata and navigation order.

## Contributing

When contributing documentation:

1. Follow the existing structure and style
2. Include front matter in all new pages
3. Test locally before pushing
4. Keep navigation order logical
5. Update this README if adding major sections

## License

Documentation is licensed under MIT License, same as the meta-log project.
