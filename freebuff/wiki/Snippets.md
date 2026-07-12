# Snippets

AIGENEV7 includes a built-in snippet manager for saving, organizing, and reusing code snippets.

## Overview

Snippets let you:
- **Save** frequently used code patterns
- **Organize** by language and tags
- **Search** through your collection
- **Insert** snippets into any conversation
- **Manage** with CLI commands

## Storage

Snippets are stored in `freebuff/snippets.json`:

```json
[
  {
    "id": "express-error-handler",
    "name": "Express Error Handler",
    "code": "app.use((err, req, res, next) => { ... })",
    "language": "javascript",
    "description": "Standard Express error handling middleware",
    "tags": ["express", "middleware", "error-handling"],
    "createdAt": "2026-07-11T10:00:00.000Z",
    "updatedAt": "2026-07-11T10:00:00.000Z"
  }
]
```

## CLI Commands

### Save a Snippet

```
/snippet save "Express Error Handler" --lang=js --tags=express,middleware
```

Then paste or type your code when prompted.

### List All Snippets

```
/snippet list
```

Displays all saved snippets with names, languages, and tags.

### Search Snippets

```
/snippet search "error handler"
```

Searches through snippet names, descriptions, and code content.

### Insert a Snippet

```
/snippet express-error-handler
```

Inserts the snippet's code into your current conversation context.

### Delete a Snippet

```
/snippet delete express-error-handler
```

Removes a snippet by name or ID.

## Filtering

### By Language

```
/snippet list --lang=python
```

### By Tag

```
/snippet list --tag=react
```

### By Search Query

```
/snippet search "authentication"
```

## API Usage

```javascript
import {
  saveSnippet,
  getSnippet,
  listSnippets,
  deleteSnippet,
  searchSnippets
} from './snippets.js'

// Save a new snippet
const snippet = saveSnippet(
  'React Button',
  '<button className="btn">{children}</button>',
  'jsx',
  'Reusable button component',
  ['react', 'ui', 'component']
)

// Get a snippet by name
const found = getSnippet('React Button')

// List all snippets
const all = listSnippets()

// Filter by language
const pythonSnippets = listSnippets({ language: 'python' })

// Filter by tag
const reactSnippets = listSnippets({ tag: 'react' })

// Search snippets
const results = searchSnippets('button')

// Delete a snippet
deleteSnippet('React Button')
```

## Snippet Structure

Each snippet has:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Auto-generated URL-safe identifier |
| `name` | string | Display name |
| `code` | string | The code content |
| `language` | string | Programming language |
| `description` | string | Optional description |
| `tags` | string[] | Optional tags for categorization |
| `createdAt` | string | ISO timestamp |
| `updatedAt` | string | ISO timestamp |

## Example Snippets

### Express Error Handler

```javascript
// Express Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})
```

### React Hook Template

```javascript
// React Custom Hook
import { useState, useEffect } from 'react'

function useCustomHook(initialValue) {
  const [value, setValue] = useState(initialValue)
  
  useEffect(() => {
    // Side effect logic
  }, [value])
  
  return [value, setValue]
}
```

### Python FastAPI Endpoint

```python
# FastAPI Endpoint
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    name: str
    price: float

@app.post("/items/")
async def create_item(item: Item):
    return {"item": item, "message": "Item created"}
```

## Tips

1. **Use descriptive names** — Makes snippets easy to find
2. **Add relevant tags** — Helps with filtering and organization
3. **Include comments** — Explains what the snippet does
4. **Keep snippets focused** — One concept per snippet
5. **Update regularly** — Keep snippets current with best practices

---

*See [Commands](Commands) for all CLI commands and [Custom Agents](Custom-Agents) for agent management.*
