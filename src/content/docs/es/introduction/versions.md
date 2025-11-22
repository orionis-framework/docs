---
title: 'Versiones'
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Liberación OpenSource

Orionis Framework está en un proceso de **liberación gradual OpenSource**. El framework ha sido desarrollado, probado y está siendo utilizado como base tecnológica de diversos sistemas empresariales en producción.

### Estado del Proceso

- ✅ **Framework Core**: Funcionalidades principales probadas y estables
- 🔄 **Documentación**: En proceso de desarrollo y mejora continua
- 🔄 **Componentes**: Liberación gradual de módulos y funcionalidades
- ⏳ **Testing Público**: Preparación para pruebas de la comunidad

Este proceso de liberación requiere tiempo y dedicación para asegurar la calidad, organización y documentación adecuada de cada componente. Agradecemos la paciencia y el apoyo de la comunidad mientras completamos este proceso.

## Versiones Disponibles

### Versión Actual en PyPI

La versión más reciente disponible públicamente:

<div class="version-info">
    <div class="version-badge">
        <span class="version-label">Versión Actual:</span>
        <span id="current-version" class="version-number">Cargando...</span>
    </div>
    <div class="version-status">
        <span id="version-status">OpenSource - Liberación Gradual</span>
    </div>
</div>

### Historial de Versiones

| Versión | Estado | Fecha Estimada | Descripción |
|---------|--------|----------------|-------------|
| <span id="dynamic-version">-</span> | 🟡 Actual | - | Versión actual en liberación pública gradual |
| 1.0.0 | ⏳ Planificada | Marzo 2026 | Primera versión estable completa |
| 2.0.0 | 🔮 Futuro | Q4 2026 | Arquitectura mejorada y breaking changes |

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
            currentVersionEl.textContent = 'Cargando...';
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
            statusEl.textContent = `OpenSource - Liberación Gradual (actualizada hace ${timeSinceUpload} días)`;
        } catch (error) {
            currentVersionEl.textContent = 'No disponible';
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
