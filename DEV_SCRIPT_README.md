# Development Script Usage

## Quick Start

Run both backend and frontend servers concurrently:

```bash
# Option 1: Direct execution
./dev.sh

# Option 2: Using bun script
bun run dev:apps
```

## Features

### 🚀 **Concurrent Server Execution**
- **Backend**: Hono server on port 4000
- **Frontend**: Next.js with Turbopack on port 41000

### 🌐 **Interactive Controls**
While the servers are running, you can use keyboard shortcuts:

**Browser Controls:**
- Press **`1`** - Open Backend API (http://localhost:4000) in browser
- Press **`2`** - Open Frontend App (http://localhost:41000) in browser  

**IDE Controls:**
- Press **`3`** - Open Backend project in Cursor IDE
- Press **`4`** - Open Frontend project in Cursor IDE

**Other:**
- Press **`h`** - Show help menu
- Press **`Ctrl+C`** - Stop all servers

### 🛡️ **Safety Features**
- Port availability checking before startup
- Graceful shutdown of all processes
- Process ID tracking for clean management
- Error handling and validation
- IDE detection (Cursor preferred, VS Code fallback)

### 🎨 **Visual Interface**
- Color-coded output for different services
- Real-time status updates
- Clear service identification in logs

## Requirements

- **Bun** package manager installed
- Ports 4000 and 41000 available
- Modern terminal with color support
- **Cursor IDE** or VS Code (optional, for IDE shortcuts)

## Project Structure Expected

```
project-root/
├── dev.sh              # This script
├── package.json        # Root package.json
└── apps/
    ├── backend/        # Backend application
    │   ├── server.ts   # Server entry point
    │   └── package.json
    └── frontend/       # Frontend application
        ├── package.json
        └── next.config.ts
```

## Troubleshooting

### Port Already in Use
If you see port conflicts:
```bash
# Check what's using the port
lsof -i :4000
lsof -i :41000

# Kill the process if needed
kill -9 <PID>
```

### Browser Not Opening
The script will try different browser commands:
- `xdg-open` (Linux)
- `gnome-open` (GNOME)
- `open` (macOS)

If none work, manually open the URLs shown in the terminal.

### IDE Not Opening
The script will try different IDE commands:
- `cursor` (Cursor IDE - preferred)
- `code` (VS Code - fallback)

If neither is found, install Cursor IDE: https://cursor.sh/

### Permission Issues
Make sure the script is executable:
```bash
chmod +x dev.sh
```

## API Endpoints

When running, these endpoints are available:

### Backend (Port 4000)
- **Health Check**: http://localhost:4000/health
- **Finance API**: http://localhost:4000/api/finance
- **Full API**: http://localhost:4000

### Frontend (Port 41000)
- **Next.js App**: http://localhost:41000

## Development Workflow

1. Start servers: `./dev.sh`
2. Press `2` to open frontend app in browser
3. Press `4` to open frontend project in Cursor IDE
4. Press `1` to open backend API for testing
5. Press `3` to open backend project in Cursor IDE
6. Develop with hot-reload enabled on both sides
7. Press `Ctrl+C` when done

---

**Note**: This script uses bun exclusively as specified in your project requirements.
