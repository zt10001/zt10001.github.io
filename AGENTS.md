# Repository Guidelines

This is a GitHub Pages site built with Jekyll and a custom terminal-window
theme in `_sass/terminal.scss`, styled after [oddbit.ai](https://oddbit.ai):
a dark monospace "terminal" card with a title bar, shell prompt lines, and
`## section` headers.

## Local Development

```bash
bundle install
bundle exec jekyll serve
```

The site is available at `http://localhost:4000`.

## Content

- Edit site metadata in `_config.yml`. `theme_config.shell_user` and
  `theme_config.shell_host` control the `user@host` shown in prompts.
- Edit the home page — tagline, sections, about lines, socials — in
  `_data/menu.yml`.
- Add published articles to `_posts/` using `YYYY-MM-DD-title.md`; the optional
  `description:` front matter is shown next to the title in listings.
- Keep unpublished articles in `_drafts/`.
- Use `layout: post` for articles and `layout: page` for standalone pages.
  A page may override `term_cmd` (the shell command in the prompt) and
  `term_path` (the path in the window title bar).

## Verification

Before committing, run:

```bash
bundle exec jekyll build
```
