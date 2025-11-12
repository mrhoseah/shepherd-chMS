# PDF Generation Setup

The application uses jsreport with Chrome/Chromium for PDF generation. If you encounter errors about missing Chrome dependencies, follow these steps:

## Installing Required Dependencies (Linux/WSL)

Run the following command to install all required system libraries:

```bash
sudo apt-get update && sudo apt-get install -y \
  libnspr4 \
  libnss3 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libasound2 \
  libpango-1.0-0 \
  libcairo2
```

## Alternative: Use Excel/CSV Export

If you cannot install the dependencies, you can use the Excel or CSV export options available in the reports section. These do not require any additional system dependencies.

## Troubleshooting

### Error: "Failed to launch the browser process"

This means Chrome/Chromium cannot start. Common causes:
1. Missing system libraries (install using command above)
2. Insufficient permissions
3. Running in a restricted environment (Docker, etc.)

### Error: "libnspr4.so: cannot open shared object file"

Install the missing library:
```bash
sudo apt-get install -y libnspr4
```

## Production Deployment

For production environments:
- Ensure all dependencies are installed on the server
- Consider using a Docker image that includes Chrome dependencies
- Or use a headless Chrome service/API for PDF generation

