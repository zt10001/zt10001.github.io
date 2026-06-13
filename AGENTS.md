# Repository Guidelines

This is a GitHub Pages site built with Jekyll and vendored files from the
[`no-style-please`](https://github.com/riggraz/no-style-please) theme.

## Local Development

```bash
bundle install
bundle exec jekyll serve
```

The site is available at `http://localhost:4000`.

## Content

- Edit site metadata in `_config.yml`.
- Edit the home-page navigation in `_data/menu.yml`.
- Add published articles to `_posts/` using `YYYY-MM-DD-title.md`.
- Keep unpublished articles in `_drafts/`.
- Use `layout: post` for articles and `layout: page` for standalone pages.

## Verification

Before committing, run:

```bash
bundle exec jekyll build
```
