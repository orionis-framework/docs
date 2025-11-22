---
title: 'Versions'
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## OpenSource Release

Orionis Framework is undergoing a **gradual OpenSource release**. The framework has been developed, tested, and is currently used as the technological foundation for various enterprise systems in production.

### Release Status

- ✅ **Framework Core**: Main features tested and stable
- 🔄 **Documentation**: Under continuous development and improvement
- 🔄 **Components**: Gradual release of modules and features
- ⏳ **Public Testing**: Preparing for community testing

This release process requires time and dedication to ensure the quality, organization, and proper documentation of each component. We appreciate the community's patience and support as we complete this process.

## Available Versions

### Current Version on PyPI

The latest publicly available version:

<div class="version-info">
    <div class="version-badge">
        <span class="version-label">Current Version:</span>
        <span id="current-version" class="version-number">Loading...</span>
    </div>
    <div class="version-status">
        <span id="version-status">OpenSource - Gradual Release</span>
    </div>
</div>

### Version History

| Version | Status | Estimated Date | Description |
|---------|--------|---------------|-------------|
| <span id="dynamic-version">-</span> | 🟡 Current | - | Current version in gradual public release |
| 1.0.0 | ⏳ Planned | March 2026 | First complete stable release |
| 2.0.0 | 🔮 Future | Q4 2026 | Improved architecture and breaking changes |

<style>
.version-info {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1.5rem;
    border-radius: 8px;
    margin: 1rem 0;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
.version-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
}
.version-label {
    font-weight: 600;
    font-size: 0.9rem;
    opacity: 0.9;
}
.version-number {
    background: rgba(255, 255, 255, 0.2);
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-family: 'Courier New', monospace;
    font-weight: 700;
    font-size: 1.1rem;
}
.version-status {
    font-size: 0.85rem;
    opacity: 0.8;
}
.loading {
    animation: pulse 2s infinite;
}
@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {
    async function fetchVersionInfo() {
        const currentVersionEl = document.getElementById('current-version');
        const dynamicVersionEl = document.getElementById('dynamic-version');
        const statusEl = document.getElementById('version-status');
        try {
            // Show loading state
            currentVersionEl.textContent = 'Loading...';
            currentVersionEl.classList.add('loading');
            // Fetch version from PyPI
            const response = await fetch('https://pypi.org/pypi/orionis/json');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            const version = data.info.version;
            const uploadTime = new Date(data.urls[0]?.upload_time || Date.now());
            // Update elements with version info
            currentVersionEl.textContent = `v${version}`;
            currentVersionEl.classList.remove('loading');
            dynamicVersionEl.textContent = `v${version}`;
            // Update status with additional info
            const timeSinceUpload = Math.floor((Date.now() - uploadTime.getTime()) / (1000 * 60 * 60 * 24));
            statusEl.textContent = `OpenSource - Gradual Release (updated ${timeSinceUpload} days ago)`;
        } catch (error) {
            currentVersionEl.textContent = 'Not available';
            currentVersionEl.classList.remove('loading');
            dynamicVersionEl.textContent = 'Error';
            statusEl.textContent = 'Error loading version info';
            // Retry after 5 seconds
            setTimeout(() => {
                fetchVersionInfo();
            }, 5000);
        }
    }
    // Run fetch function
    fetchVersionInfo();
    // Update every 5 minutes
    setInterval(fetchVersionInfo, 300000);
});
</script>
