---
allowed-tools: mcp__playwright__*, Bash(mkdir*, mv*)
argument-hint: [url] [instructions]
description: Take full page screenshots at 1280x720 viewport
---

## context

This command uses the Playwright MCP server to navigate to any URL, resize the viewport to 1280x720, and take screenshots.

Screenshots are automatically saved to `public/screenshots/` for use in the project.

## task

Take screenshots of the URL provided in $1, following any special instructions in $2:

1. **Parse arguments**:
   - $1: URL to navigate to (required)
   - $2: Special instructions (optional) - e.g., "scroll to bottom", "click login button", "wait 5 seconds"

2. **Navigate and resize**:
   - Navigate to the URL using `mcp__playwright__browser_navigate`
   - Resize viewport to 1280x720 using `mcp__playwright__browser_resize`

3. **Follow special instructions (if provided)**:
   - If $2 contains instructions, execute them using appropriate Playwright tools
   - Examples: clicking elements, scrolling, waiting, typing text, etc.

4. **Take screenshots**:
   - Take viewport screenshot: `mcp__playwright__browser_take_screenshot`
     - filename: `public/screenshots/viewport-{timestamp}.png`
   - Take full page screenshot: `mcp__playwright__browser_take_screenshot`
     - filename: `public/screenshots/fullpage-{timestamp}.png`
     - fullPage: true

5. **Move screenshots to correct location**:
   - Playwright saves to `.playwright-mcp/public/screenshots/` by default
   - Create `public/screenshots/` if it doesn't exist
   - Move all PNG files from `.playwright-mcp/public/screenshots/` to `public/screenshots/`
   - Command: `mkdir -p public/screenshots && mv .playwright-mcp/public/screenshots/*.png public/screenshots/`

6. **Confirm completion**:
   - List the screenshots that were saved
   - Show the full paths to the screenshot files

## examples

**Basic screenshot:**
```
/screenshot https://example.com
```

**Screenshot with wait:**
```
/screenshot http://localhost:3000 "wait 2 seconds"
```

**Screenshot after clicking:**
```
/screenshot https://example.com "click the login button"
```

**Screenshot after scrolling:**
```
/screenshot https://example.com "scroll to bottom"
```

## notes

- Default viewport size is 1280x720
- Both viewport and full page screenshots are captured
- Screenshots are saved with timestamps to avoid overwriting
- Special instructions are interpreted and executed using Playwright tools
- Full page screenshots include the entire scrollable page height
